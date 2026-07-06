import os
import sys
import argparse
import logging
from dotenv import load_dotenv

# Load env variables from .env file (checks root or backend/.env)
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout
)
logger = logging.getLogger("school_leads")

# Import our custom modules
from scraper import scrape_google_maps_leads
from classifier import (
    classify_institution_type, 
    evaluate_website_screenshot, 
    evaluate_institution_atmosphere,
    extract_info_from_website_text,
    is_location_near_area
)
from socials import evaluate_social_media_status
from sheets import save_leads_to_excel, sync_to_google_sheets

def run_lead_pipeline(area: str, school_type: str, limit: int, output_file: str = None, log_callback: callable = None, existing_file: str = "") -> list:
    """
    Runs the automated school lead generation pipeline programmatically.
    Optionally accepts a log_callback to capture all log messages in real-time.
    """
    # Set up custom logging callback handler if provided
    handler = None
    loggers = [
        logging.getLogger("school_leads"),
        logging.getLogger("scraper"),
        logging.getLogger("classifier"),
        logging.getLogger("socials"),
        logging.getLogger("sheets")
    ]
    
    if log_callback:
        class CallbackHandler(logging.Handler):
            def emit(self, record):
                try:
                    self.format(record)
                    log_callback(record.message)
                except Exception:
                    pass
        handler = CallbackHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"))
        for l in loggers:
            l.addHandler(handler)

    try:
        area = area.strip().lower()
        school_type = school_type.strip()
        
        if not output_file:
            output_file = f"school_leads_{area.replace(' ', '_')}.xlsx"
            
        logger.info("=" * 60)
        logger.info("Starting Automated School Lead Generation Pipeline")
        logger.info(f"Target Area: {area}")
        logger.info(f"School Type: {school_type}")
        logger.info(f"Lead Limit:  {limit}")
        logger.info("=" * 60)
        
        # 1. Scrape basic info from Google Maps
        max_results = limit if limit > 0 else 30
        raw_leads = scrape_google_maps_leads(area, school_type, max_results=max_results)
        
        if not raw_leads:
            logger.error("No leads were found or scraped. Exiting.")
            return []
            
        # Load existing leads names to skip
        import json
        existing_names = []
        if existing_file and os.path.exists(existing_file):
            try:
                with open(existing_file, "r", encoding="utf-8") as f:
                    existing_names = json.load(f)
                logger.info(f"Loaded {len(existing_names)} existing school names to skip.")
            except Exception as e:
                logger.error(f"Error loading existing-file: {e}")

        enriched_leads = []
        
        # 2. Enrich leads using classifier and social checker
        for idx, lead in enumerate(raw_leads, 1):
            school_name = lead["school_name"]
            website_url = lead["website_url"]
            contact_number = lead["contact_number"]
            rating = lead["google_rating"]
            photo_url = lead["photo_url"]
            address = lead.get("address", "")
            
            # Skip if already exists in database
            school_name_clean = school_name.lower().strip()
            if school_name_clean in existing_names:
                logger.info(f"Lead '{school_name}' already exists in database. Skipping details enrichment.")
                continue

            logger.info("-" * 50)
            logger.info(f"Enriching Lead {idx}/{len(raw_leads)}: {school_name}")
            
            # 1. Smart Location Adjacency Filtering (DISABLED per client request)
            # address_clean = address.strip().lower()
            # if not address_clean or address_clean in ["n/a", "none", "null"]:
            #     # Keep if address is missing
            #     pass
            # else:
            #     if not is_location_near_area(address, area):
            #         logger.warning(f"Skipping lead '{school_name}' because address '{address}' is not located in or near the search area '{area}'")
            #         continue
            
            # A. Classify Institution Type
            inst_type = classify_institution_type(school_name, school_type)
            
            # 2. Smart Board Type Filtering (DISABLED per client request)
            school_type_lower = school_type.lower()
            # if "matric" in school_type_lower and inst_type.lower() in ["cbse", "international"]:
            #     logger.warning(f"Skipping lead '{school_name}' because classified type '{inst_type}' does not match target 'Matriculation'")
            #     continue
            # elif "cbse" in school_type_lower and inst_type.lower() in ["matriculation", "international"]:
            #     logger.warning(f"Skipping lead '{school_name}' because classified type '{inst_type}' does not match target 'CBSE'")
            #     continue
            # elif ("international" in school_type_lower or "intl" in school_type_lower) and inst_type.lower() in ["matriculation", "cbse"]:
            #     logger.warning(f"Skipping lead '{school_name}' because classified type '{inst_type}' does not match target 'International'")
            #     continue
            
            # B. Audit Website Appearance & Remarks
            appearance, remarks, website_text = evaluate_website_screenshot(website_url)
            
            # Refine type based on website text keywords if name-based classification was ambiguous
            if inst_type.lower() not in ["cbse", "matriculation", "international"] or inst_type == "Other":
                if website_text:
                    web_lower = website_text.lower()
                    if "cbse" in web_lower or "central board" in web_lower:
                        inst_type = "CBSE"
                    elif "matriculation" in web_lower or "matric" in web_lower:
                        inst_type = "Matriculation"
                    elif "international" in web_lower or "global school" in web_lower:
                        inst_type = "International"
                        
            # Re-verify board type filter skips after website text refinement (DISABLED per client request)
            # if "matric" in school_type_lower and inst_type.lower() in ["cbse", "international"]:
            #     logger.warning(f"Skipping lead '{school_name}' because refined type '{inst_type}' does not match target 'Matriculation'")
            #     continue
            # elif "cbse" in school_type_lower and inst_type.lower() in ["matriculation", "international"]:
            #     logger.warning(f"Skipping lead '{school_name}' because refined type '{inst_type}' does not match target 'CBSE'")
            #     continue
            # elif ("international" in school_type_lower or "intl" in school_type_lower) and inst_type.lower() in ["matriculation", "cbse"]:
            #     logger.warning(f"Skipping lead '{school_name}' because refined type '{inst_type}' does not match target 'International'")
            #     continue
            
            # Extract contact details & specific area name from website text, falling back to Google Maps details
            info = extract_info_from_website_text(
                website_text, 
                lead.get("address", ""), 
                lead.get("contact_number", ""), 
                area
            )
            
            # C. Audit Atmosphere (Cover photo check)
            atmosphere = evaluate_institution_atmosphere(photo_url, rating)
            
            # D. Check Social Media Activity
            social_status, social_remark = evaluate_social_media_status(website_url, school_name, area)
            if social_remark:
                remarks = f"{remarks} | {social_remark}" if remarks else social_remark
            
            enriched_lead = {
                "school_name": school_name,
                "website_url": website_url,
                "contact_number": info["contact_number"],
                "area_name": info["area_name"],
                "address": info["address"],
                "institution_type": inst_type,
                "appearance": appearance,
                "remarks": remarks,
                "atmosphere": atmosphere,
                "social_media": social_status,
                "google_rating": rating,
                "photo_url": photo_url
            }
            
            logger.info(f"Lead Status: Type={inst_type}, Web={appearance}, Atmosphere={atmosphere}, Social={social_status}")
            enriched_leads.append(enriched_lead)
            
        # 3. Export data to Excel
        logger.info("=" * 60)
        logger.info("Enrichment complete. Saving results...")
        excel_path = save_leads_to_excel(enriched_leads, output_file)
        if excel_path:
            logger.info(f"Saved Excel workbook to: {excel_path}")
            
        # 4. Sync to Google Sheets if ID configured in environment
        sheet_id = os.getenv("GOOGLE_SHEET_ID")
        if sheet_id:
            success = sync_to_google_sheets(enriched_leads, sheet_id)
            if success:
                logger.info("Google Sheets synced successfully!")
            else:
                logger.warning("Google Sheets sync was skipped or failed.")
                
        logger.info("Process finished successfully.")
        logger.info("=" * 60)
        import json
        print(f"DATABASE_JSON:{json.dumps(enriched_leads)}")
        return enriched_leads

    finally:
        if handler:
            for l in loggers:
                l.removeHandler(handler)

def main():
    parser = argparse.ArgumentParser(description="School Lead Generation and Website Auditing Tool")
    parser.add_argument("--area", type=str, default="tambaram", help="Target area name (e.g. tambaram)")
    parser.add_argument("--type", type=str, default="matriculation schools", help="Type of school (e.g. matriculation schools)")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of leads to fetch (0 for unlimited)")
    parser.add_argument("--output", type=str, default="", help="Output Excel file path (optional)")
    parser.add_argument("--existing-file", type=str, default="", help="Path to JSON file containing existing school names to skip")
    
    args = parser.parse_args()
    
    run_lead_pipeline(
        area=args.area,
        school_type=args.type,
        limit=args.limit,
        output_file=args.output,
        existing_file=args.existing_file
    )

if __name__ == "__main__":
    main()

