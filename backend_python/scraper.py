import logging
import urllib.parse
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

def scrape_google_maps_leads(area: str, school_type: str, max_results: int = 15):
    """
    Scrapes school leads from Google Maps using Playwright.
    Returns a list of dictionaries with school details.
    """
    st_clean = school_type.strip().lower()
    # Normalize school_type: if it doesn't contain "school" or similar keywords, append "schools"
    if not any(k in st_clean for k in ["school", "academy", "institution", "college"]):
        query_type = f"{school_type} schools"
    else:
        query_type = school_type
        
    query = f"{query_type} in {area}"
    search_url = f"https://www.google.com/maps/search/{urllib.parse.quote_plus(query)}"
    logger.info(f"Starting Google Maps search for: {query}")
    logger.info(f"Search URL: {search_url}")
    
    leads = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        
        # Navigate to search url
        page.goto(search_url, timeout=60000)
        page.wait_for_timeout(3000)  # Wait for page load
        
        # Scroll the left sidebar (role="feed") to load matching items
        scrollable_selector = 'div[role="feed"]'
        
        try:
            page.wait_for_selector(scrollable_selector, timeout=10000)
            logger.info("Found search results sidebar.")
        except Exception:
            logger.warning("Could not find scrollable feed container. Checking if direct listing opened.")
            # If there's only one search result, Google Maps might redirect directly to the place page.
            if "/maps/place/" in page.url:
                logger.info("Redirected directly to place page.")
                lead = parse_place_details(page, area)
                if lead:
                    leads.append(lead)
                browser.close()
                return leads
            else:
                logger.error("No results container found and not redirected. Search query might have returned 0 results.")
                browser.close()
                return leads

        # Collect place URLs in exact rank order as we scroll
        place_urls = []
        scroll_attempts = 0
        max_scroll_attempts = 60
        last_height = 0
        no_change_count = 0
        
        while len(place_urls) < max_results and scroll_attempts < max_scroll_attempts:
            # Get list of place links in current view
            feed_el = page.query_selector(scrollable_selector)
            place_elements = feed_el.query_selector_all('a[href*="/maps/place/"]') if feed_el else page.query_selector_all('a[href*="/maps/place/"]')
            
            # Append new links in order of discovery
            for el in place_elements:
                href = el.get_attribute("href")
                if href and href not in place_urls:
                    place_urls.append(href)
                    if len(place_urls) >= max_results:
                        break
            
            logger.info(f"Collected {len(place_urls)} unique place links on scroll attempt {scroll_attempts+1}")
            
            if len(place_urls) >= max_results:
                break

            # Scroll to the bottom of the sidebar to trigger next lazy load batch
            page.evaluate(
                f"""
                const feed = document.querySelector('{scrollable_selector}');
                if (feed) {{
                    feed.scrollTo(0, feed.scrollHeight);
                }}
                """
            )
            try:
                # Hover over the feed container to focus the scroll context, then scroll and press PageDown
                feed_el = page.query_selector(scrollable_selector)
                if feed_el:
                    feed_el.hover()
                    page.mouse.wheel(0, 1500)
                    feed_el.press("PageDown")
                    page.wait_for_timeout(500)
                    feed_el.press("PageDown")
            except Exception as scroll_err:
                logger.debug(f"Keyboard scroll error: {scroll_err}")
                
            # Wait for lazy loading to fetch and render new elements
            page.wait_for_timeout(2000)
            
            # Check if height changed
            new_height = page.evaluate(f"document.querySelector('{scrollable_selector}').scrollHeight")
            if new_height == last_height:
                no_change_count += 1
                logger.info(f"Scroll height did not change (attempt {no_change_count}/6). Waiting for results...")
                
                # Scroll up slightly and down to nudge lazy load event listener
                if no_change_count > 1:
                    page.evaluate(
                        f"""
                        const feed = document.querySelector('{scrollable_selector}');
                        if (feed) {{
                            feed.scrollTo(0, feed.scrollHeight - 500);
                            setTimeout(() => {{ feed.scrollTo(0, feed.scrollHeight); }}, 100);
                        }}
                        """
                    )
                
                if no_change_count >= 6:
                    logger.info("Reached the absolute end of the results list.")
                    break
            else:
                no_change_count = 0  # Reset counter if height changed
                
            last_height = new_height
            scroll_attempts += 1
            
        logger.info(f"Total unique place URLs collected: {len(place_urls)}")
        
        # Visit each place page and extract info
        for idx, url in enumerate(place_urls, 1):
            logger.info(f"Processing lead {idx}/{len(place_urls)}: {url}")
            try:
                page.goto(url, timeout=12000)
                page.wait_for_timeout(2000)  # Wait for details panel to load
                
                lead = parse_place_details(page, area)
                if lead:
                    leads.append(lead)
            except Exception as e:
                logger.error(f"Error scraping details for {url}: {e}")
                
        browser.close()
        
    return leads

def parse_place_details(page, area: str) -> dict:
    """
    Parses the current details pane of a place page in Google Maps.
    """
    try:
        # 1. School Name
        name_selector = 'h1'
        page.wait_for_selector(name_selector, timeout=5000)
        school_name = page.query_selector(name_selector).inner_text().strip()
        logger.info(f"Scraped School Name: {school_name}")
        
        # 2. Website URL
        website_url = ""
        # Check standard data-item-id="authority" attribute
        web_el = page.query_selector('a[data-item-id="authority"]')
        if web_el:
            website_url = web_el.get_attribute("href")
        else:
            # Fallback to check any links inside details panel that look like external domains
            links = page.query_selector_all('a[href^="http"]')
            for link in links:
                href = link.get_attribute("href")
                # Exclude internal Google/Maps utility links (TOS, feedback, products, etc.)
                is_google = href and any(x in href.lower() for x in ["google.", "gstatic.", "googleusercontent.", "ggpht."])
                if href and not is_google:
                    website_url = href
                    break
                    
        # Clean up google redirect wrapper
        if website_url:
            if "google.com/url?q=" in website_url:
                parsed_wrapper = urllib.parse.parse_qs(urllib.parse.urlparse(website_url).query)
                website_url = parsed_wrapper.get("q", [website_url])[0]
                
        # Yahoo Search fallback if website is missing on Google Maps
        if not website_url:
            logger.info(f"Website link missing on Google Maps for '{school_name}'. Querying Yahoo Search fallback...")
            try:
                search_page = page.context.new_page()
                search_query = f"{school_name} {area} official website"
                search_url = f"https://search.yahoo.com/search?p={urllib.parse.quote_plus(search_query)}"
                search_page.goto(search_url, timeout=12000)
                search_page.wait_for_timeout(2000)
                
                ignored_domains = [
                    "yahoo.com", "google.com", "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
                    "youtube.com", "wikipedia.org", "justdial.com", "sulekha.com", "indiamart.com",
                    "schoolmykids.com", "shiksha.com", "educationworld.in", "careerindia.com",
                    "indiahall.in", "dialastreet.com", "yelp.com", "tripadvisor.com", "localnears.com"
                ]
                
                links = search_page.query_selector_all('a[href]')
                for link in links:
                    href = link.get_attribute("href")
                    if href and href.startswith("http"):
                        parsed_domain = urllib.parse.urlparse(href).netloc.lower()
                        if not any(ignored in parsed_domain for ignored in ignored_domains):
                            website_url = href
                            logger.info(f"Found fallback website: {website_url}")
                            break
                search_page.close()
            except Exception as se:
                logger.warning(f"Error in search website fallback: {se}")
                
        logger.info(f"Website URL: {website_url}")
        
        # 3. Contact Number
        contact_number = ""
        # Check data-item-id starting with phone:tel:
        phone_el = page.query_selector('button[data-item-id^="phone:tel:"]')
        if phone_el:
            # Extract phone number from data-item-id
            item_id = phone_el.get_attribute("data-item-id")
            contact_number = item_id.replace("phone:tel:", "").strip()
        else:
            # Fallback search matching phone aria-label
            phone_el_alt = page.query_selector('button[aria-label^="Phone:"]')
            if phone_el_alt:
                contact_number = phone_el_alt.get_attribute("aria-label").replace("Phone:", "").strip()
                
        # If no contact number is found on Google Maps, run a search query fallback
        if not contact_number:
            logger.info(f"Contact number missing on Google Maps for '{school_name}'. Querying Search fallback...")
            try:
                search_page = page.context.new_page()
                search_query = f"{school_name} {area} contact phone number"
                search_url = f"https://search.yahoo.com/search?p={urllib.parse.quote_plus(search_query)}"
                search_page.goto(search_url, timeout=12000)
                search_page.wait_for_timeout(2000)
                
                search_text = search_page.evaluate("() => document.body.innerText") or ""
                search_page.close()
                
                import re
                patterns = [
                    r'\+91[\s-]?\d{10}',
                    r'\b044[\s-]?\d{7,8}\b',
                    r'\b[789]\d{4}[\s-]?\d{5}\b',
                    r'\b\d{4}[\s-]?\d{3}[\s-]?\d{3}\b'
                ]
                found_numbers = []
                for pattern in patterns:
                    for match in re.finditer(pattern, search_text):
                        num = match.group(0).strip()
                        num = re.sub(r'^[- \t]+|[- \t]+$', '', num)
                        digits = "".join(filter(str.isdigit, num))
                        unique_suffix = digits[-10:] if len(digits) >= 10 else digits
                        if unique_suffix and not any("".join(filter(str.isdigit, f))[-10:] == unique_suffix for f in found_numbers):
                            found_numbers.append(num)
                            if len(found_numbers) >= 2:
                                break
                    if len(found_numbers) >= 2:
                        break
                if found_numbers:
                    contact_number = " / ".join(found_numbers)
                    logger.info(f"Found fallback contact number(s) from search: {contact_number}")
            except Exception as se:
                logger.warning(f"Error in search contact fallback: {se}")
                
        logger.info(f"Contact Number: {contact_number}")
        
        # 4. Rating and reviews (used for backup atmosphere checks)
        rating = ""
        rating_el = page.query_selector('div.F7nice span[aria-hidden="true"]')
        if rating_el:
            rating = rating_el.inner_text().strip()
            
        # 5. Get school building image URL
        photo_url = ""
        # Google Maps photo is usually inside a button with class "ao3aC" or "g77Oh" or contains images
        photo_el = page.query_selector('button[aria-label^="Photo of"] img')
        if photo_el:
            photo_url = photo_el.get_attribute("src")
        else:
            # Fallback to first image in details pane
            img_el = page.query_selector('img[src^="https://lh5.googleusercontent.com"]')
            if img_el:
                photo_url = img_el.get_attribute("src")
                
        logger.info(f"Photo URL found: {photo_url[:60]}..." if photo_url else "No Photo URL found")

        # 6. Address
        address = ""
        address_el = page.query_selector('button[data-item-id="address"]')
        if address_el:
            address = address_el.inner_text().strip()
        else:
            # Fallback search matching address aria-label
            address_el_alt = page.query_selector('button[aria-label^="Address:"]')
            if address_el_alt:
                address = address_el_alt.get_attribute("aria-label").replace("Address:", "").strip()
        # Clean up any Google Maps special characters like the map pin symbol (usually \ue0c8)
        address = address.replace("\ue0c8", "").strip()
        logger.info(f"Address found: {address}")

        return {
            "school_name": school_name,
            "website_url": website_url,
            "contact_number": contact_number,
            "area_name": area,
            "google_rating": rating,
            "photo_url": photo_url,
            "address": address
        }
    except Exception as e:
        logger.error(f"Failed to parse place details: {e}")
        return None

if __name__ == "__main__":
    # Quick debug logging
    logging.basicConfig(level=logging.INFO)
    print("Scraping a test lead from Maps...")
    leads = scrape_google_maps_leads("tambaram", "matriculation schools", max_results=2)
    print(f"Scraped leads: {leads}")
