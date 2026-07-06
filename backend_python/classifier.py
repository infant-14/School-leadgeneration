import os
import logging
import io
import requests
from PIL import Image
import google.generativeai as genai
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

# Initialize AI Provider
api_key = os.getenv("GEMINI_API_KEY")
ai_provider = os.getenv("AI_PROVIDER")

# Auto-detect AI provider if not explicitly configured
if not ai_provider:
    if api_key:
        ai_provider = "gemini"
    else:
        ai_provider = "none"
ai_provider = ai_provider.strip().lower()

# Initialize Gemini if provider is Gemini
if ai_provider == "gemini":
    if api_key:
        genai.configure(api_key=api_key)
    else:
        logger.warning("AI_PROVIDER is set to 'gemini', but GEMINI_API_KEY is not set. Gemini calls will fail.")
elif ai_provider == "ollama":
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    logger.info(f"Ollama AI Provider initialized with base URL: {ollama_base_url}")
else:
    logger.info("AI evaluation is disabled (provider = none). Local fallbacks will be used.")

def get_gemini_model():
    """Returns the Gemini 1.5 Flash model client."""
    return genai.GenerativeModel("gemini-1.5-flash")

def query_ollama(prompt: str, model_name: str, image_bytes: bytes = None, is_json: bool = False) -> str:
    """Queries local Ollama instance."""
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    url = f"{ollama_url}/api/chat"
    
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False
    }
    
    if image_bytes:
        import base64
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        payload["messages"][0]["images"] = [b64_image]
        
    if is_json:
        payload["format"] = "json"
        
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            content = result.get("message", {}).get("content", "").strip()
            return content
        else:
            logger.error(f"Ollama returned status code {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error querying Ollama model '{model_name}': {e}")
    return ""

def _fallback_classify_institution_type(school_name: str, target_type: str = "Matriculation") -> str:
    # Fallback keyword matching
    name_lower = school_name.lower()
    if "cbse" in name_lower or "central" in name_lower:
        return "CBSE"
    elif "international" in name_lower or "global" in name_lower:
        return "International"
    elif "matric" in name_lower or "matriculation" in name_lower:
        return "Matriculation"
    
    # Default to the target type instead of hardcoding "Matriculation"
    tgt_clean = target_type.lower()
    if "cbse" in tgt_clean:
        return "CBSE"
    elif "international" in tgt_clean:
        return "International"
    return "Matriculation"

def classify_institution_type(school_name: str, target_type: str = "Matriculation") -> str:
    """
    Classifies the institution type (e.g. CBSE, Matriculation, International)
    based on the school name.
    """
    # Fast path keyword matching (100% accurate, no API call needed)
    name_lower = school_name.lower()
    if "matriculation" in name_lower or "matric" in name_lower:
        return "Matriculation"
    elif "cbse" in name_lower or "central board" in name_lower:
        return "CBSE"
    elif "international" in name_lower or "global school" in name_lower:
        return "International"

    if ai_provider == "none":
        return _fallback_classify_institution_type(school_name, target_type)

    prompt = (
        f"Classify the institution type of '{school_name}' based on its name. "
        "Choose from: 'Matriculation', 'CBSE', 'International', or 'Other'. "
        "Return only the selected classification name and nothing else."
    )

    if ai_provider == "gemini":
        if not api_key:
            return _fallback_classify_institution_type(school_name, target_type)
        try:
            model = get_gemini_model()
            response = model.generate_content(prompt)
            result = response.text.strip()
            logger.info(f"Gemini classified type for '{school_name}': {result}")
            return result
        except Exception as e:
            logger.error(f"Error classifying institution type via Gemini: {e}")
            return _fallback_classify_institution_type(school_name, target_type)
            
    elif ai_provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        try:
            result = query_ollama(prompt, model_name)
            if result:
                cleaned = result.strip()
                # If the model gives extra text, extract the key categories
                for cat in ['Matriculation', 'CBSE', 'International', 'Other']:
                    if cat.lower() in cleaned.lower():
                        logger.info(f"Ollama classified type for '{school_name}': {cat}")
                        return cat
                logger.info(f"Ollama classified type for '{school_name}': {cleaned}")
                return cleaned
            return _fallback_classify_institution_type(school_name, target_type)
        except Exception as e:
            logger.error(f"Error classifying institution type via Ollama: {e}")
            return _fallback_classify_institution_type(school_name, target_type)

    return _fallback_classify_institution_type(school_name, target_type)

def extract_area_from_address(address: str, default_area: str) -> str:
    if not address:
        return default_area.capitalize()
    
    parts = [p.strip() for p in address.split(',')]
    
    # Find Chennai or other city keyword in the address parts
    chennai_idx = -1
    for i, part in enumerate(parts):
        if "chennai" in part.lower():
            chennai_idx = i
            break
            
    if chennai_idx > 0:
        # The part before "Chennai" is usually the suburb/area
        area = parts[chennai_idx - 1]
        # If it's a number or OMR/ECR road details, look one part further back
        if area.isdigit() or len(area) <= 2 or any(x in area.lower() for x in ["road", "street", "nagar", "omr", "ecr"]):
            # Use nagar if it contains suburb names, otherwise go back
            if "nagar" in area.lower() and not any(x in area.lower() for x in ["road", "street"]):
                pass
            elif chennai_idx > 1:
                area = parts[chennai_idx - 2]
        return area.strip().capitalize()
        
    if len(parts) >= 3:
        return parts[-3].strip().capitalize()
    elif len(parts) >= 2:
        return parts[-2].strip().capitalize()
        
    return default_area.capitalize()


def extract_info_from_website_text(text: str, gmaps_address: str, gmaps_phone: str, search_area: str) -> dict:
    """
    Uses Gemini/Ollama to extract contact number, full address, and local area name
    from website text, falling back to Google Maps data if website doesn't contain them.
    """
    cleaned_text = text[:8000] if text else ""
    default_area = extract_area_from_address(gmaps_address, search_area)
    
    fallback_data = {
        "contact_number": gmaps_phone or "N/A",
        "address": gmaps_address or "N/A",
        "area_name": default_area
    }
    
    if not cleaned_text or ai_provider == "none":
        return fallback_data
        
    prompt = (
        "You are an information extraction assistant. Analyze the following text extracted from a school's website "
        "and find the school's contact number (phone number), full address, and the specific local area/neighborhood name (e.g., Sholinganallur, Navalur, Semmancheri, Tambaram, etc.).\n\n"
        f"If the website text does not contain a contact number, fall back to: '{gmaps_phone}'.\n"
        f"If the website text does not contain a full address, fall back to: '{gmaps_address}'.\n"
        f"If the website text does not contain a local area name, fall back to: '{default_area}'.\n\n"
        "Return the result as a simple JSON object with exactly three keys: 'contact_number', 'address', and 'area_name'.\n"
        "Ensure the area_name is just the name of the suburb/neighborhood (e.g. 'Semmancheri' or 'Navalur', not the full address).\n"
        "Ensure the contact_number is in a clean, readable format.\n"
        "Ensure the address is the complete postal address.\n\n"
        f"Website text content:\n{cleaned_text}"
    )
    
    if ai_provider == "gemini":
        if not api_key:
            return fallback_data
        try:
            model = get_gemini_model()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            data = json.loads(response.text.strip())
            return {
                "contact_number": data.get("contact_number") or fallback_data["contact_number"],
                "address": data.get("address") or fallback_data["address"],
                "area_name": (data.get("area_name") or fallback_data["area_name"]).strip().capitalize()
            }
        except Exception as e:
            logger.error(f"Gemini failed to extract info from website text: {e}")
            return fallback_data
            
    elif ai_provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        try:
            result = query_ollama(prompt, model_name, is_json=True)
            if result:
                import json
                data = json.loads(result.strip())
                return {
                    "contact_number": data.get("contact_number") or fallback_data["contact_number"],
                    "address": data.get("address") or fallback_data["address"],
                    "area_name": (data.get("area_name") or fallback_data["area_name"]).strip().capitalize()
                }
        except Exception as e:
            logger.error(f"Ollama failed to extract info from website text: {e}")
            
    return fallback_data


def evaluate_website_screenshot(website_url: str) -> tuple:
    """
    Captures a website screenshot, gets website text, and evaluates its appearance.
    Returns a tuple of (appearance, remarks, website_text).
    """
    # 1. Handle missing website
    if not website_url:
        return "Fresh", "No website found. Needs a fresh design built.", ""

    screenshot_bytes = None
    website_text = ""
    
    # 2. Try to capture website screenshot and text content using Playwright
    try:
        logger.info(f"Capturing screenshot and text of website: {website_url}")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
            context = browser.new_context(
                ignore_https_errors=True,  # School sites often have bad SSL
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800}
            )
            page = context.new_page()
            
            # Short timeout to avoid stalling the process
            page.goto(website_url, timeout=25000, wait_until="load")
            page.wait_for_timeout(2000)  # Wait for animations to settle
            screenshot_bytes = page.screenshot(full_page=False)
            
            # Get homepage text
            homepage_text = page.evaluate("() => document.body.innerText") or ""
            
            # Search for contact link
            contact_text = ""
            contact_url = None
            try:
                links = page.query_selector_all('a')
                for link in links:
                    href = link.get_attribute("href")
                    link_text = (link.inner_text() or "").strip().lower()
                    if href and any(keyword in link_text for keyword in ["contact", "reach", "about"]):
                        import urllib.parse
                        contact_url = urllib.parse.urljoin(website_url, href)
                        break
            except Exception as link_err:
                logger.warning(f"Error finding contact link: {link_err}")
                
            if contact_url and contact_url != website_url:
                try:
                    logger.info(f"Navigating to contact page: {contact_url}")
                    page.goto(contact_url, timeout=15000, wait_until="load")
                    page.wait_for_timeout(1000)
                    contact_text = page.evaluate("() => document.body.innerText") or ""
                except Exception as contact_err:
                    logger.warning(f"Failed to load contact page {contact_url}: {contact_err}")
            
            website_text = homepage_text + "\n" + contact_text
            browser.close()
    except Exception as e:
        logger.warning(f"Failed to capture screenshot for {website_url}: {e}")
        # If site is unreachable, it's a good candidate for redesign!
        return "Redesign", f"Website failed to load: {str(e)[:50]}. Suggest redesigning and hosting a reliable site.", ""

    # 3. Handle none provider
    if ai_provider == "none":
        return "Redesign", "Need to improve the design (Local dev default)", website_text

    prompt = (
        "You are an expert website designer reviewing school websites to see if they need redesign services. "
        "Look at this screenshot of the school website. "
        "1. Is the design modern, clean, mobile-friendly and professional? Choose either 'Good' or 'Redesign'. "
        "2. Provide a 1-sentence friendly remark recommending what to improve (e.g. 'Need to improve the design, update layout, make mobile friendly' or 'Website looks professional'). "
        "Format your response as a simple JSON object containing keys 'appearance' and 'remarks'. For example:\n"
        '{"appearance": "Redesign", "remarks": "Need to improve the design and update the layout."}'
    )

    # 4. Use Gemini Vision to evaluate screenshot
    if ai_provider == "gemini":
        if not api_key:
            logger.warning("No Gemini API key available. Defaulting appearance to Redesign.")
            return "Redesign", "Need to improve the design (Local dev default)", website_text
        try:
            image = Image.open(io.BytesIO(screenshot_bytes))
            model = get_gemini_model()
            
            # Request JSON output
            response = model.generate_content(
                [image, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            import json
            data = json.loads(response.text.strip())
            appearance = data.get("appearance", "Redesign")
            remarks = data.get("remarks", "Need to improve the design")
            logger.info(f"Gemini Web Audit: {appearance} - {remarks}")
            return appearance, remarks, website_text
        except Exception as e:
            logger.error(f"Gemini API failure during web audit: {e}")
            return "Redesign", "Need to improve the design", website_text

    # 5. Use Ollama Vision to evaluate screenshot
    elif ai_provider == "ollama":
        vision_model = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
        try:
            result = query_ollama(prompt, vision_model, image_bytes=screenshot_bytes, is_json=True)
            if result:
                import json
                data = json.loads(result.strip())
                appearance = data.get("appearance", "Redesign")
                remarks = data.get("remarks", "Need to improve the design")
                logger.info(f"Ollama Web Audit ({vision_model}): {appearance} - {remarks}")
                return appearance, remarks, website_text
        except Exception as e:
            logger.error(f"Ollama failure during web audit: {e}")
        return "Redesign", "Need to improve the design (Ollama fallback)", website_text

    return "Redesign", "Need to improve the design", website_text

def _fallback_atmosphere_rating(rating: str) -> str:
    if rating:
        try:
            r_val = float(rating)
            return "Good" if r_val >= 4.0 else "Bad"
        except ValueError:
            pass
    return "Good"

def evaluate_institution_atmosphere(photo_url: str, rating: str = "") -> str:
    """
    Downloads the Google Maps cover image and evaluates the atmosphere.
    Falls back to rating analysis if no photo exists or API fails.
    """
    # 1. Fallback if no photo is available
    if not photo_url:
        logger.info("No photo URL provided. Falling back to rating analysis.")
        return _fallback_atmosphere_rating(rating)

    # 2. Try to download the photo
    img_bytes = None
    try:
        response = requests.get(photo_url, timeout=10)
        if response.status_code == 200:
            img_bytes = response.content
    except Exception as e:
        logger.warning(f"Could not download school image from {photo_url[:40]}...: {e}")

    # 3. Use local rules if provider is none or download failed
    if ai_provider == "none" or not img_bytes:
        return _fallback_atmosphere_rating(rating)

    prompt = (
        "Look at this Google Maps photo of a school campus. "
        "Assess if the school buildings, grounds, and atmosphere look well-maintained, welcoming, and high-quality ('Good') "
        "or if it looks run-down, poorly painted, old, or unappealing ('Bad'). "
        "Respond with only a single word: 'Good' or 'Bad'."
    )

    # 4. Analyze image using Gemini
    if ai_provider == "gemini" and api_key:
        try:
            image = Image.open(io.BytesIO(img_bytes))
            model = get_gemini_model()
            response = model.generate_content([image, prompt])
            result = response.text.strip()
            if "Good" in result:
                return "Good"
            elif "Bad" in result:
                return "Bad"
            return "Good"
        except Exception as e:
            logger.error(f"Gemini API failure during photo audit: {e}")
            
    # 5. Analyze image using Ollama Vision
    elif ai_provider == "ollama":
        vision_model = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
        try:
            result = query_ollama(prompt, vision_model, image_bytes=img_bytes)
            if result:
                cleaned = result.strip()
                if "Good" in cleaned:
                    return "Good"
                elif "Bad" in cleaned:
                    return "Bad"
                if "good" in cleaned.lower():
                    return "Good"
                elif "bad" in cleaned.lower():
                    return "Bad"
        except Exception as e:
            logger.error(f"Ollama failure during photo audit: {e}")

    return _fallback_atmosphere_rating(rating)


def get_neighboring_suburbs(area: str) -> list:
    """
    Returns a list of known adjacent/neighboring suburbs for key target areas
    in Chennai and Trichy to guarantee they are never skipped.
    """
    area_clean = area.strip().lower()
    
    # Trichy region mapping
    if "srirangam" in area_clean:
        return ["srirangam", "thiruvanaikoil", "thiruvanai kovil", "thiruvanai", "koothur", "woraiyur", "chathiram", "chatram"]
    elif "thiruvanaikoil" in area_clean or "thiruvanai kovil" in area_clean:
        return ["thiruvanaikoil", "thiruvanai kovil", "srirangam", "koothur"]
    
    # Chennai regions
    elif "medavakkam" in area_clean:
        return ["medavakkam", "pallikaranai", "kovilambakkam", "nanmangalam", "santhosapuram", "perumbakkam", "vengaivasal", "vengavasal", "selaiyur", "sholinganallur", "semmancheri"]
    elif "tambaram" in area_clean:
        return ["tambaram", "chromepet", "selaiyur", "chitlapakkam", "irumbuliyur", "mudichur", "peerkankaranai", "perungalathur", "sanatorium", "pallavaram", "vandalur"]
    elif "adyar" in area_clean:
        return ["adyar", "thiruvanmiyur", "besant nagar", "ra puram", "mylapore", "velachery", "kotturpuram", "guindy"]
    elif "sholinganallur" in area_clean:
        return ["sholinganallur", "perumbakkam", "semmancheri", "navalur", "karapakkam", "okkiyam", "thoraipakkam", "medavakkam"]
        
    return [area_clean]


def is_location_near_area(address: str, search_area: str) -> bool:
    """
    Uses Gemini/Ollama to determine if the school address is located in or immediately
    adjacent to the searched area. If AI is disabled, uses a simple substring check.
    """
    if not address or address.strip().lower() in ["n/a", "none", "null"]:
        return True # Default to keep if no address found
        
    # If the search area or any of its known neighboring suburbs are in the address, it is near!
    neighbors = get_neighboring_suburbs(search_area)
    address_lower = address.lower()
    if any(n in address_lower for n in neighbors):
        return True
        
    if ai_provider == "none":
        return True
        
    prompt = (
        f"Is the location address '{address}' located in or immediately adjacent/neighboring to the area '{search_area}'?\n"
        "Please respond with only a single word: 'Yes' or 'No'."
    )
    
    if ai_provider == "gemini":
        if not api_key:
            return True
        try:
            model = get_gemini_model()
            response = model.generate_content(prompt)
            result = response.text.strip().lower()
            logger.info(f"Gemini near check for '{address}' in '{search_area}': {result}")
            return "yes" in result
        except Exception as e:
            logger.error(f"Gemini error in is_location_near_area: {e}")
            return True
            
    elif ai_provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        try:
            result = query_ollama(prompt, model_name)
            cleaned = result.strip().lower()
            logger.info(f"Ollama near check for '{address}' in '{search_area}': {cleaned}")
            return "yes" in cleaned
        except Exception as e:
            logger.error(f"Ollama error in is_location_near_area: {e}")
            return True
            
    return True
