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
elif ai_provider == "groq":
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("AI_PROVIDER is set to 'groq', but GROQ_API_KEY is not set. Groq calls will fail.")
    else:
        logger.info("Groq AI Provider initialized.")
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

def query_groq(prompt: str, model_name: str, image_bytes: bytes = None, is_json: bool = False) -> str:
    """Queries Groq API."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY is not set.")
        return ""
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    if image_bytes:
        import base64
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        message_content = [
            {
                "type": "text",
                "text": prompt
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{b64_image}"
                }
            }
        ]
    else:
        message_content = prompt

    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": message_content
            }
        ],
        "temperature": 0.2
    }
    
    if is_json:
        payload["response_format"] = {"type": "json_object"}
        
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            return content
        else:
            logger.error(f"Groq returned status code {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error querying Groq model '{model_name}': {e}")
    return ""

def _fallback_classify_institution_type(school_name: str) -> str:
    # Fallback keyword matching
    name_lower = school_name.lower()
    if "cbse" in name_lower or "central" in name_lower:
        return "CBSE"
    elif "international" in name_lower or "global" in name_lower:
        return "International"
    elif "matric" in name_lower or "matriculation" in name_lower:
        return "Matriculation"
    return "Matriculation"  # Default fallback based on search context

def classify_institution_type(school_name: str) -> str:
    """
    Classifies the institution type (e.g. CBSE, Matriculation, International)
    based on the school name.
    """
    if ai_provider == "none":
        return _fallback_classify_institution_type(school_name)

    prompt = (
        f"Classify the institution type of '{school_name}' based on its name. "
        "Choose from: 'Matriculation', 'CBSE', 'International', or 'Other'. "
        "Return only the selected classification name and nothing else."
    )

    if ai_provider == "gemini":
        if not api_key:
            return _fallback_classify_institution_type(school_name)
        try:
            model = get_gemini_model()
            response = model.generate_content(prompt)
            result = response.text.strip()
            logger.info(f"Gemini classified type for '{school_name}': {result}")
            return result
        except Exception as e:
            logger.error(f"Error classifying institution type via Gemini: {e}")
            return _fallback_classify_institution_type(school_name)
            
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
            return _fallback_classify_institution_type(school_name)
        except Exception as e:
            logger.error(f"Error classifying institution type via Ollama: {e}")
            return _fallback_classify_institution_type(school_name)

    elif ai_provider == "groq":
        model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        try:
            result = query_groq(prompt, model_name)
            if result:
                cleaned = result.strip()
                for cat in ['Matriculation', 'CBSE', 'International', 'Other']:
                    if cat.lower() in cleaned.lower():
                        logger.info(f"Groq classified type for '{school_name}': {cat}")
                        return cat
                logger.info(f"Groq classified type for '{school_name}': {cleaned}")
                return cleaned
            return _fallback_classify_institution_type(school_name)
        except Exception as e:
            logger.error(f"Error classifying institution type via Groq: {e}")
            return _fallback_classify_institution_type(school_name)

    return _fallback_classify_institution_type(school_name)

def is_invalid_area(val: str) -> bool:
    if not val:
        return True
    val_lower = val.lower()
    return (
        val.isdigit() or 
        len(val.strip()) <= 2 or 
        "+" in val or
        any(x in val_lower for x in [
            "road", "street", "nagar", "omr", "ecr", "salai", "st", "rd", 
            "lane", "bypass", "highway", "layout", "colony", "extension", 
            "ext", "near", "opposite", "behind", "next", "school", "plot", 
            "flat", "door", "no:", "no.", "floor", "building", "phase", "sector"
        ])
    )

def extract_area_from_address(address: str, default_area: str) -> str:
    if not address:
        return default_area.capitalize()
    
    parts = [p.strip() for p in address.split(',')]
    clean_default = default_area.strip().lower()
    
    # Check if we can find a city/district or search_area keyword in the address parts
    city_idx = -1
    matched_keyword = ""
    for keyword in ["chennai", clean_default]:
        for i, part in enumerate(parts):
            if keyword in part.lower():
                city_idx = i
                matched_keyword = keyword
                break
        if city_idx != -1:
            break
            
    if city_idx > 0:
        # Start checking parts before the matched keyword
        curr_idx = city_idx - 1
        while curr_idx >= 0:
            area = parts[curr_idx]
            if not is_invalid_area(area):
                return area.strip().capitalize()
            curr_idx -= 1
            
        # If everything before is a road/street/invalid, and we matched the default_area, return it
        if matched_keyword == clean_default:
            return default_area.capitalize()
            
        # Otherwise, if we matched "chennai", try to find a valid nagar/colony before it
        curr_idx = city_idx - 1
        while curr_idx >= 0:
            area = parts[curr_idx]
            area_lower = area.lower()
            if "nagar" in area_lower or "colony" in area_lower:
                return area.strip().capitalize()
            curr_idx -= 1
            
        return parts[city_idx].strip().capitalize()
        
    elif city_idx == 0:
        return parts[city_idx].strip().capitalize()
        
    # Fallback logic if neither "chennai" nor default_area is explicitly in the parts
    for i in [-3, -2]:
        if abs(i) <= len(parts):
            area = parts[i]
            if not is_invalid_area(area):
                return area.strip().capitalize()
                
    return default_area.capitalize()


def extract_address_fallback(text: str) -> str:
    """
    Tries to find a postal address inside the website text using regex and heuristics.
    It isolates the lines immediately preceding the Chennai pin code (600xxx)
    and trims menu prefixes by starting the address at the first door/street number.
    """
    if not text:
        return ""
    import re
    
    # 1. Search for Chennai pin code (e.g. 600119 or 600 119)
    match = re.search(r'\b(600\s*\d{3})\b', text)
    if not match:
        return ""
        
    pincode = match.group(1)
    
    # Extract up to 300 characters preceding the pin code
    start_pos = max(0, match.start() - 300)
    preceding_text = text[start_pos:match.start()]
    
    # Split preceding text by newlines to avoid traversing different sections/headers
    lines = [line.strip() for line in preceding_text.split('\n') if line.strip()]
    if not lines:
        return ""
        
    # Use the last line (or last two lines if the last line is short)
    candidate_source = lines[-1]
    if len(lines) >= 2 and len(candidate_source) < 40:
        candidate_source = f"{lines[-2]} {candidate_source}"
        
    candidate_source = re.sub(r'\s+', ' ', candidate_source).strip()
    
    # Find the true start of the address (e.g. door number, st number, or "No", "Plot", "Door")
    # Matches: 11, 3rd, No 4, No. 12, Plot 10, Door No 2, Flat A1
    start_match = re.search(r'\b(?:No\.?|Plot|Door|Flat|Block|Phase)?\s*\d+[\s,/-]*', candidate_source)
    if start_match:
        address_part = candidate_source[start_match.start():]
    else:
        # Fallback to last 150 chars if no number pattern is found
        address_part = candidate_source[-150:]
        
    final_address = f"{address_part} {pincode}".strip()
    # Clean leading formatting/punctuation
    final_address = re.sub(r'^[:\s,.-]+', '', final_address)
    
    # Verify it looks like a valid address candidate
    lower_addr = final_address.lower()
    keywords = ["nagar", "street", "road", "chennai", "st.", "rd.", "tamil", "school", "campus", "block", "floor", "near"]
    if any(kw in lower_addr for kw in keywords):
        return final_address
        
    # Fallback to looking for "Address" or "Location" labeled lines if pincode search failed
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if "address" in line_lower or "location:" in line_lower:
            candidate = " ".join([l.strip() for l in lines[i:i+3] if l.strip()])
            candidate = re.sub(r'\s+', ' ', candidate)
            candidate = re.sub(r'(?i)^\s*address\s*:\s*', '', candidate)
            if len(candidate) > 10 and len(candidate) < 250:
                return candidate
                
    return ""

def extract_phone_fallback(text: str) -> str:
    """
    Tries to find unique contact phone numbers inside the website text using regex
    and returns them joined by ' / ' (maximum of 2 unique numbers).
    """
    if not text:
        return ""
    import re
    
    # Standard patterns for Indian mobile and landline (with 044 area code) numbers
    patterns = [
        r'\+91[\s-]?\d{10}',
        r'\b044[\s-]?\d{7,8}\b',
        r'\b[789]\d{4}[\s-]?\d{5}\b',
        r'\b\d{4}[\s-]?\d{3}[\s-]?\d{3}\b'
    ]
    
    found_numbers = []
    
    # We find all matching occurrences in the text
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            num = match.group(0).strip()
            # Clean formatting slightly (remove leading/trailing hyphens or spaces)
            num = re.sub(r'^[- \t]+|[- \t]+$', '', num)
            # Deduplicate by comparing digits only
            digits = "".join(filter(str.isdigit, num))
            # Indian numbers might have +91 prefix. Let's match 10-digit suffixes for uniqueness check
            unique_suffix = digits[-10:] if len(digits) >= 10 else digits
            
            if unique_suffix and not any("".join(filter(str.isdigit, f))[-10:] == unique_suffix for f in found_numbers):
                found_numbers.append(num)
                if len(found_numbers) >= 2:
                    break
        if len(found_numbers) >= 2:
            break
            
    if found_numbers:
        return " / ".join(found_numbers)
    return ""

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
    
    result_data = None
    
    if not cleaned_text or ai_provider == "none":
        result_data = fallback_data
    else:
        prompt = (
            "You are an information extraction assistant. Analyze the following text extracted from a school's website "
            "and find the school's contact numbers (phone numbers), full address, and the specific local area/neighborhood name (e.g., Sholinganallur, Navalur, Semmancheri, Tambaram, etc.).\n\n"
            f"If the website text does not contain any contact numbers, fall back to: '{gmaps_phone}'.\n"
            f"If the website text does not contain a full address, fall back to: '{gmaps_address}'.\n"
            f"If the website text does not contain a local area name, fall back to: '{default_area}'.\n\n"
            "Return the result as a simple JSON object with exactly three keys: 'contact_number', 'address', and 'area_name'.\n"
            "Ensure the area_name is just the name of the suburb/neighborhood (e.g. 'Semmancheri' or 'Navalur', not the full address).\n"
            "Ensure the contact_number is in a clean, readable format. If you find multiple contact numbers, list up to 2 unique ones separated by ' / '.\n"
            "Ensure the address is the complete postal address.\n\n"
            f"Website text content:\n{cleaned_text}"
        )
        
        if ai_provider == "gemini":
            if not api_key:
                result_data = fallback_data
            else:
                try:
                    model = get_gemini_model()
                    response = model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                    import json
                    data = json.loads(response.text.strip())
                    extracted_area = data.get("area_name") or ""
                    if not extracted_area or is_invalid_area(extracted_area):
                        final_area = fallback_data["area_name"]
                    else:
                        final_area = extracted_area.strip().capitalize()
                        
                    result_data = {
                        "contact_number": data.get("contact_number") or fallback_data["contact_number"],
                        "address": data.get("address") or fallback_data["address"],
                        "area_name": final_area
                    }
                except Exception as e:
                    logger.error(f"Gemini failed to extract info from website text: {e}")
                    result_data = fallback_data
                    
        elif ai_provider == "ollama":
            model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
            try:
                result = query_ollama(prompt, model_name, is_json=True)
                if result:
                    import json
                    data = json.loads(result.strip())
                    extracted_area = data.get("area_name") or ""
                    if not extracted_area or is_invalid_area(extracted_area):
                        final_area = fallback_data["area_name"]
                    else:
                        final_area = extracted_area.strip().capitalize()
                        
                    result_data = {
                        "contact_number": data.get("contact_number") or fallback_data["contact_number"],
                        "address": data.get("address") or fallback_data["address"],
                        "area_name": final_area
                    }
            except Exception as e:
                logger.error(f"Ollama failed to extract info from website text: {e}")
                
        elif ai_provider == "groq":
            model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
            try:
                result = query_groq(prompt, model_name, is_json=True)
                if result:
                    import json
                    data = json.loads(result.strip())
                    extracted_area = data.get("area_name") or ""
                    if not extracted_area or is_invalid_area(extracted_area):
                        final_area = fallback_data["area_name"]
                    else:
                        final_area = extracted_area.strip().capitalize()
                        
                    result_data = {
                        "contact_number": data.get("contact_number") or fallback_data["contact_number"],
                        "address": data.get("address") or fallback_data["address"],
                        "area_name": final_area
                    }
            except Exception as e:
                logger.error(f"Groq failed to extract info from website text: {e}")

    if not result_data:
        result_data = fallback_data

    # Final post-extraction fallback if values are still empty or N/A
    if cleaned_text:
        if result_data["address"] == "N/A" or not result_data["address"]:
            fallback_addr = extract_address_fallback(cleaned_text)
            if fallback_addr:
                result_data["address"] = fallback_addr
                better_area = extract_area_from_address(fallback_addr, search_area)
                if better_area:
                    result_data["area_name"] = better_area
                    
    # Combine google maps phone number and website phone numbers
    gmaps_p = result_data.get("contact_number") or gmaps_phone or ""
    if gmaps_p == "N/A":
        gmaps_p = ""
        
    web_p = extract_phone_fallback(cleaned_text) if cleaned_text else ""
    
    # Merge unique numbers
    all_phones = []
    if gmaps_p:
        for p in gmaps_p.split("/"):
            p_clean = p.strip()
            if p_clean and p_clean not in all_phones:
                all_phones.append(p_clean)
                
    if web_p:
        for p in web_p.split("/"):
            p_clean = p.strip()
            digits = "".join(filter(str.isdigit, p_clean))
            unique_suffix = digits[-10:] if len(digits) >= 10 else digits
            if p_clean and not any("".join(filter(str.isdigit, x))[-10:] == unique_suffix for x in all_phones):
                all_phones.append(p_clean)
                
    all_phones = all_phones[:2]
    if all_phones:
        result_data["contact_number"] = " / ".join(all_phones)
    else:
        result_data["contact_number"] = "N/A"
                
    return result_data


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

    # 6. Use Groq Vision to evaluate screenshot
    elif ai_provider == "groq":
        vision_model = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
        try:
            result = query_groq(prompt, vision_model, image_bytes=screenshot_bytes, is_json=True)
            if result:
                import json
                data = json.loads(result.strip())
                appearance = data.get("appearance", "Redesign")
                remarks = data.get("remarks", "Need to improve the design")
                logger.info(f"Groq Web Audit ({vision_model}): {appearance} - {remarks}")
                return appearance, remarks, website_text
        except Exception as e:
            logger.error(f"Groq failure during web audit: {e}")
        return "Redesign", "Need to improve the design (Groq fallback)", website_text

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

    # 6. Analyze image using Groq Vision
    elif ai_provider == "groq":
        vision_model = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
        try:
            result = query_groq(prompt, vision_model, image_bytes=img_bytes)
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
            logger.error(f"Groq failure during photo audit: {e}")

    return _fallback_atmosphere_rating(rating)


def is_location_near_area(address: str, search_area: str) -> bool:
    """
    Uses Gemini/Ollama/Groq to determine if the school address is located in or immediately
    adjacent to the searched area. If AI is disabled, uses a simple substring check.
    """
    if not address:
        return True # Default to keep if no address found
        
    # Standard clean search area check
    clean_area = search_area.strip().lower()
    
    # If the search area is directly mentioned in the address, it is definitely in/near!
    if clean_area in address.lower():
        return True
        
    if ai_provider == "none":
        # Fallback substring check (simple heuristic)
        # If the search area is in the address, it was already caught.
        # Otherwise, since we don't have AI, we keep it to avoid false negatives.
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

    elif ai_provider == "groq":
        model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        try:
            result = query_groq(prompt, model_name)
            cleaned = result.strip().lower()
            logger.info(f"Groq near check for '{address}' in '{search_area}': {cleaned}")
            return "yes" in cleaned
        except Exception as e:
            logger.error(f"Groq error in is_location_near_area: {e}")
            return True
            
    return True
