import re
import logging
from datetime import datetime, timedelta
import urllib.parse
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

def evaluate_social_media_status(website_url: str, school_name: str, area: str) -> str:
    """
    Orchestrates finding social media links and checking if any are active.
    Uses a single, optimized Playwright browser session to minimize startup overhead.
    Returns 'Active' or 'Inactive'.
    """
    social_urls = {"facebook": "", "instagram": "", "linkedin": ""}
    is_active = False
    
    try:
        with sync_playwright() as p:
            # Launch Chromium once for all checks
            browser = p.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
            context = browser.new_context(
                ignore_https_errors=True,
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US"
            )
            page = context.new_page()
            
            # 1. Scan website if it exists
            if website_url:
                try:
                    logger.info(f"Scanning website {website_url} for social links...")
                    page.goto(website_url, timeout=15000, wait_until="commit")
                    page.wait_for_timeout(1000)
                    
                    hrefs = page.evaluate(
                        "() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href)"
                    )
                    for href in hrefs:
                        href_lower = href.lower()
                        if "facebook.com" in href_lower and not social_urls["facebook"]:
                            social_urls["facebook"] = href
                        elif "instagram.com" in href_lower and not social_urls["instagram"]:
                            social_urls["instagram"] = href
                        elif "linkedin.com" in href_lower and not social_urls["linkedin"]:
                            social_urls["linkedin"] = href
                except Exception as e:
                    logger.warning(f"Error scanning website for social links: {e}")
                    
            # 2. Fallback Yahoo Search for missing links
            platforms = ["facebook", "instagram"]
            for platform in platforms:
                if not social_urls[platform]:
                    try:
                        search_query = f"{school_name} {area} {platform}"
                        search_url = f"https://search.yahoo.com/search?p={urllib.parse.quote_plus(search_query)}"
                        logger.info(f"Searching Yahoo for: {search_query}")
                        page.goto(search_url, timeout=12000)
                        page.wait_for_timeout(1500)
                        
                        links = page.query_selector_all('a[href]')
                        for link in links:
                            href = link.get_attribute("href")
                            if href and f"{platform}.com" in href.lower() and "yahoo.com" not in href.lower():
                                social_urls[platform] = href
                                break
                    except Exception as e:
                        logger.warning(f"Error finding {platform} link via Yahoo Search: {e}")
                        
            logger.info(f"Found social links for '{school_name}': {social_urls}")
            
            # 3. Check Facebook activity
            if social_urls["facebook"]:
                try:
                    logger.info(f"Checking Facebook page activity: {social_urls['facebook']}")
                    page.goto(social_urls["facebook"], timeout=15000)
                    page.wait_for_timeout(2000)
                    
                    html_content = page.content()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    page_text = soup.get_text()
                    
                    current_month = datetime.now().strftime("%B")
                    prev_month = (datetime.now() - timedelta(days=30)).strftime("%B")
                    recent_keywords = [
                        "Just now", "yesterday", "hrs ago", "mins ago", "days ago",
                        current_month, prev_month
                    ]
                    
                    # Check simple keywords
                    for word in recent_keywords:
                        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                        if pattern.search(page_text):
                            logger.info(f"Found recent posting activity indicator keyword: '{word}' on Facebook.")
                            is_active = True
                            break
                            
                    # Check precise regexes (handles layout concatenations like 'account6h')
                    if not is_active:
                        hours_match = re.search(r'(?<!\d)([1-9]|1\d|2[0-3])h\b', page_text, re.IGNORECASE)
                        days_match = re.search(r'(?<!\d)([1-9]|[1-2]\d|30)d\b', page_text, re.IGNORECASE)
                        ago_match = re.search(r'\b\d+\s*(hrs?|hours?|days?|mins?|minutes?)\s*ago\b', page_text, re.IGNORECASE)
                        
                        if hours_match:
                            logger.info(f"Found recent posting activity: '{hours_match.group(0)}' (hours ago) on Facebook.")
                            is_active = True
                        elif days_match:
                            logger.info(f"Found recent posting activity: '{days_match.group(0)}' (days ago) on Facebook.")
                            is_active = True
                        elif ago_match:
                            logger.info(f"Found recent posting activity: '{ago_match.group(0)}' on Facebook.")
                            is_active = True
                except Exception as e:
                    logger.error(f"Error checking Facebook activity: {e}")
                    
            # 4. Check Instagram activity (only if Facebook was not active/found)
            if not is_active and social_urls["instagram"]:
                try:
                    logger.info(f"Checking Instagram page activity: {social_urls['instagram']}")
                    page.goto(social_urls["instagram"], timeout=15000)
                    page.wait_for_timeout(2000)
                    
                    html_content = page.content()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Look for datetime attributes inside <time> tags
                    time_tags = soup.find_all('time')
                    for tag in time_tags:
                        dt_str = tag.get('datetime')
                        if dt_str:
                            try:
                                date_part = dt_str.split('T')[0]
                                post_date = datetime.strptime(date_part, "%Y-%m-%d")
                                if datetime.now() - post_date <= timedelta(days=30):
                                    logger.info(f"Found recent Instagram post date: {date_part}")
                                    is_active = True
                                    break
                            except Exception:
                                pass
                                
                    if not is_active:
                        page_text = soup.get_text()
                        current_month = datetime.now().strftime("%B")
                        prev_month = (datetime.now() - timedelta(days=30)).strftime("%B")
                        recent_keywords = [
                            "Just now", "yesterday", "hrs ago", "mins ago", "days ago",
                            current_month, prev_month
                        ]
                        for word in recent_keywords:
                            pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                            if pattern.search(page_text):
                                logger.info(f"Found recent posting activity indicator keyword: '{word}' on Instagram.")
                                is_active = True
                                break
                                
                        if not is_active:
                            hours_match = re.search(r'(?<!\d)([1-9]|1\d|2[0-3])h\b', page_text, re.IGNORECASE)
                            days_match = re.search(r'(?<!\d)([1-9]|[1-2]\d|30)d\b', page_text, re.IGNORECASE)
                            weeks_match = re.search(r'(?<!\d)([1-4])w\b', page_text, re.IGNORECASE)
                            ago_match = re.search(r'\b\d+\s*(hrs?|hours?|days?|mins?|minutes?)\s*ago\b', page_text, re.IGNORECASE)
                            
                            if hours_match:
                                logger.info(f"Found recent posting activity: '{hours_match.group(0)}' on Instagram.")
                                is_active = True
                            elif days_match:
                                logger.info(f"Found recent posting activity: '{days_match.group(0)}' on Instagram.")
                                is_active = True
                            elif weeks_match:
                                logger.info(f"Found recent posting activity: '{weeks_match.group(0)}' on Instagram.")
                                is_active = True
                            elif ago_match:
                                logger.info(f"Found recent posting activity: '{ago_match.group(0)}' on Instagram.")
                                is_active = True
                except Exception as e:
                    logger.error(f"Error checking Instagram activity: {e}")
                    
            browser.close()
    except Exception as outer_err:
        logger.error(f"Outer error in social scan orchestration: {outer_err}")
        
    return "Active" if is_active else "Inactive"
