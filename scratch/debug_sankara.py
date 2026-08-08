import logging
import urllib.parse
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_sankara")

def run():
    query = "Sri Sankara Global Academy, East Tambaram"
    search_url = f"https://www.google.com/maps/search/{urllib.parse.quote_plus(query)}"
    logger.info(f"Opening: {search_url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        page.goto(search_url, timeout=60000)
        page.wait_for_timeout(5000)
        
        # Save search result screenshot
        page.screenshot(path="scratch/sankara_search.png")
        logger.info("Saved search screenshot to scratch/sankara_search.png")
        
        # If redirect to place page
        logger.info(f"Final URL: {page.url}")
        
        # Find all link tags in page
        links = page.query_selector_all('a')
        logger.info(f"Total links on page: {len(links)}")
        for idx, link in enumerate(links):
            href = link.get_attribute("href")
            text = link.inner_text().strip()
            data_item_id = link.get_attribute("data-item-id")
            aria_label = link.get_attribute("aria-label")
            if href or data_item_id or aria_label:
                # Print links that might be the website
                if href and ("http" in href) and not any(x in href.lower() for x in ["google.", "gstatic.", "googleusercontent.", "ggpht."]):
                    logger.info(f"External Link: href={href}, text={text}, data-item-id={data_item_id}, aria-label={aria_label}")
                elif data_item_id == "authority" or (aria_label and "website" in aria_label.lower()):
                    logger.info(f"Potential Website Link: href={href}, text={text}, data-item-id={data_item_id}, aria-label={aria_label}")
        
        # Print buttons that might be website
        buttons = page.query_selector_all('button')
        for btn in buttons:
            aria_label = btn.get_attribute("aria-label")
            data_item_id = btn.get_attribute("data-item-id")
            if aria_label and "website" in aria_label.lower():
                logger.info(f"Website Button: text={btn.inner_text().strip()}, aria-label={aria_label}, data-item-id={data_item_id}")
                
        browser.close()

if __name__ == "__main__":
    run()
