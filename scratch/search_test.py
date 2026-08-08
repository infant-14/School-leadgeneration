import logging
import urllib.parse
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("search_test")

def run():
    school_name = "Sri Sankara Global Academy, East Tambaram"
    area = "Tambaram"
    search_query = f"{school_name} {area} official website"
    search_url = f"https://search.yahoo.com/search?p={urllib.parse.quote_plus(search_query)}"
    logger.info(f"Searching Yahoo: {search_url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto(search_url)
        page.wait_for_timeout(2000)
        
        # Save screenshot
        page.screenshot(path="scratch/yahoo_search.png")
        logger.info("Saved search screenshot to scratch/yahoo_search.png")
        
        # Dump all links with their text and href
        links = page.query_selector_all('a')
        logger.info(f"Total links: {len(links)}")
        for idx, link in enumerate(links):
            href = link.get_attribute("href")
            text = link.inner_text().strip()
            # If href starts with http and is not search-engine related
            if href and href.startswith("http"):
                domain = urllib.parse.urlparse(href).netloc.lower()
                if not any(x in domain for x in ["yahoo.", "google.", "search.yahoo"]):
                    logger.info(f"Link {idx}: href={href}, text={text}")
                    
        browser.close()

if __name__ == "__main__":
    run()
