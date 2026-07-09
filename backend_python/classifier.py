import os
import logging
import io
import requests
import re
from PIL import Image
import google.generativeai as genai
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

# Initialize AI Provider
api_key = os.getenv("GEMINI_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")
ai_provider = os.getenv("AI_PROVIDER")

# Auto-detect AI provider if not explicitly configured
if not ai_provider:
    if api_key:
        ai_provider = "gemini"
    elif groq_key:
        ai_provider = "groq"
    else:
        ai_provider = "none"
ai_provider = ai_provider.strip().lower()

# Configure APIs globally if key exists
if api_key:
    try:
        genai.configure(api_key=api_key)
        logger.info("Gemini AI Provider globally configured.")
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}")

if groq_key:
    logger.info(f"Groq AI Provider configured (Fallback or Primary). Model: {os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')}")

if ai_provider == "ollama":
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    logger.info(f"Ollama AI Provider initialized with base URL: {ollama_base_url}")


def get_gemini_model():
    """Returns the Gemini 2.5 Flash model client."""
    return genai.GenerativeModel("gemini-2.5-flash")

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


def query_groq(prompt: str, is_json: bool = False) -> str:
    """Queries Groq completions API."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("GROQ_API_KEY is not set.")
        return ""
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    if is_json:
        payload["response_format"] = {"type": "json_object"}
        
    try:
        response = requests.post(url, json=payload, timeout=20)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            logger.error(f"Groq API returned status code {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error querying Groq API: {e}")
    return ""


def query_groq_vision(prompt: str, image_bytes: bytes) -> str:
    """Queries Groq Vision completions API with an image."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("GROQ_API_KEY is not set for Groq Vision.")
        return ""
        
    import base64
    b64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64_image}"
                        }
                    }
                ]
            }
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            logger.error(f"Groq Vision API returned status code {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error querying Groq Vision API: {e}")
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

    # 1. Try Gemini (Primary if key exists)
    if api_key:
        try:
            model = get_gemini_model()
            response = model.generate_content(prompt)
            result = response.text.strip()
            logger.info(f"Gemini classified type for '{school_name}': {result}")
            return result
        except Exception as e:
            logger.error(f"Gemini classification failed, trying Groq fallback: {e}")

    # 2. Try Groq (Fallback or Primary)
    if groq_key:
        try:
            result = query_groq(prompt)
            if result:
                cleaned = result.strip()
                for cat in ['Matriculation', 'CBSE', 'International', 'Other']:
                    if cat.lower() in cleaned.lower():
                        logger.info(f"Groq classified type for '{school_name}': {cat}")
                        return cat
        except Exception as e:
            logger.error(f"Groq classification failed: {e}")

    # 3. Try Ollama
    if ai_provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        try:
            result = query_ollama(prompt, model_name)
            if result:
                cleaned = result.strip()
                for cat in ['Matriculation', 'CBSE', 'International', 'Other']:
                    if cat.lower() in cleaned.lower():
                        logger.info(f"Ollama classified type for '{school_name}': {cat}")
                        return cat
        except Exception as e:
            logger.error(f"Ollama classification failed: {e}")

    return _fallback_classify_institution_type(school_name, target_type)

def extract_pincode_from_address(address: str) -> str:
    if not address:
        return ""
    match = re.search(r'\b\d{6}\b', address)
    return match.group(0) if match else ""


def extract_area_from_address(address: str, default_area: str) -> str:
    if not address:
        return default_area.capitalize()
    
    # Check if any known local area/suburb is mentioned directly in the address
    target_suburbs = [
        "tambaram", "shollinganallur", "medavakkam", "srirangam", 
        "adyar", "chengalpattu", "thiruvanaikoil", "trichy"
    ]
    for suburb in target_suburbs:
        if re.search(r'\b' + re.escape(suburb) + r'\b', address.lower()):
            return suburb.capitalize()

    # Remove pincode from the address string when finding parts
    addr_clean = re.sub(r'\b\d{6}\b', '', address).strip()
    addr_clean = re.sub(r'-\s*$', '', addr_clean).strip() # remove trailing dash if any
    
    parts = [p.strip() for p in addr_clean.split(',')]
    parts = [p for p in parts if p]
    
    if not parts:
        return default_area.capitalize()
        
    city_keywords = ["chennai", "trichy", "tiruchirappalli", "chengalpattu", "kanchipuram", "medavakkam", "shollinganallur", "srirangam", "tambaram"]
    city_idx = -1
    for i, part in enumerate(parts):
        if any(keyword in part.lower() for keyword in city_keywords):
            city_idx = i
            break
            
    if city_idx > 0:
        area = parts[city_idx - 1]
        if area.isdigit() or len(area) <= 3 or any(x in area.lower() for x in ["road", "street", "no:", "no."]):
            if city_idx > 1:
                area = parts[city_idx - 2]
        area = re.sub(r'\b(tamil\s*nadu|tn)\b', '', area, flags=re.IGNORECASE).strip()
        return area.capitalize()
        
    if len(parts) >= 3:
        return parts[-3].strip().capitalize()
    elif len(parts) >= 2:
        return parts[-2].strip().capitalize()
        
    return default_area.capitalize()


def process_extracted_info(data: dict, gmaps_address: str, gmaps_phone: str, gmaps_pincode: str, default_area: str, search_area: str) -> dict:
    """
    Post-processes the LLM-extracted data to prioritize website information
    and cleanly fall back to Google Maps data where appropriate.
    """
    extracted_addr = data.get("address")
    extracted_pincode = data.get("pincode")
    extracted_area = data.get("area_name")
    extracted_contact = data.get("contact_number")
    
    # 1. Determine address: prioritize website address
    final_address = ""
    is_website_address_used = False
    
    if extracted_addr and isinstance(extracted_addr, str):
        cleaned_addr = extracted_addr.strip()
        # If it looks like a valid address and not a placeholder
        if len(cleaned_addr) > 10 and cleaned_addr.lower() not in ["n/a", "none", "null", "not found", "no address"]:
            final_address = cleaned_addr
            is_website_address_used = True
            
    if not is_website_address_used:
        final_address = gmaps_address or "N/A"
        
    # 2. Extract pincode from final address
    pincode = extract_pincode_from_address(final_address)
    if not pincode:
        # Check if the AI extracted a valid 6-digit pincode elsewhere
        if extracted_pincode and len(str(extracted_pincode).strip()) == 6 and str(extracted_pincode).strip().isdigit():
            pincode = str(extracted_pincode).strip()
        else:
            pincode = gmaps_pincode or ""
            
    # 3. Determine area name based on the final address and pincode
    area_name = ""
    if is_website_address_used:
        if extracted_area and isinstance(extracted_area, str) and extracted_area.lower() not in ["n/a", "none", "null", "not found", "unknown"]:
            area_name = extracted_area.strip().capitalize()
        else:
            area_name = extract_area_from_address(final_address, search_area)
    else:
        area_name = default_area
        
    # 4. Determine contact number
    contact_number = ""
    if extracted_contact and isinstance(extracted_contact, str) and len(extracted_contact.strip()) > 3 and extracted_contact.lower() not in ["n/a", "none", "null", "not found"]:
        contact_number = extracted_contact.strip()
    else:
        contact_number = gmaps_phone or "N/A"
        
    return {
        "contact_number": contact_number,
        "address": final_address,
        "pincode": pincode,
        "area_name": area_name
    }


def extract_address_fallback_rules(text: str, search_area: str) -> dict:
    """
    Heuristically extracts address, pincode, area, and phone from website text
    without calling any external AI APIs.
    """
    if not text:
        return {}
        
    # 1. Clean the text, normalize spaces and newlines
    normalized_text = re.sub(r'\s+', ' ', text)
    
    # 2. Search for 6-digit pincode patterns: e.g. 600020 or 600 020
    # Indian pincodes start with 1-8
    matches = list(re.finditer(r'\b([1-8]\d{2})\s*(\d{3})\b', normalized_text))
    
    best_candidate = None
    best_score = 0
    best_pincode = ""
    
    address_keywords = ["road", "street", "nagar", "nagar,", "salai", "colony", "opposite", "near", "no.", "no:", "floor", "lane", "campus", "canal", "cross"]
    city_keywords = ["chennai", "trichy", "tiruchirappalli", "chengalpattu", "kanchipuram", "adyar", "srirangam", "tambaram", "medavakkam", "shollinganallur"]
    
    # Navigation and garbage words to discard segments
    garbage_keywords = [
        "policy", "privacy", "terms", "conditions", "about us", "contact us", 
        "facilities", "gallery", "admission", "curricular", "activities", 
        "motto", "philosophy", "welcome", "best cbse", "schools in", "produce young",
        "challenges", "century", "english medium", "home", "academics"
    ]
    
    for m in matches:
        pincode = f"{m.group(1)}{m.group(2)}"
        pincode_start = m.start()
        
        # Take up to 250 characters before the pincode
        start_idx = max(0, pincode_start - 250)
        candidate_block = normalized_text[start_idx:pincode_start]
        
        candidate_block_clean = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', candidate_block)
        
        # Score the block based on keywords
        score = 0
        block_lower = candidate_block_clean.lower()
        
        for keyword in address_keywords:
            if keyword in block_lower:
                score += 2
        for city in city_keywords:
            if city in block_lower:
                score += 3
        # Match search area
        if search_area.lower() in block_lower:
            score += 5
        # Door number score
        if re.search(r'\b(no[:\s.]*\d+)\b', block_lower):
            score += 4
            
        if score > best_score and score > 2:
            best_score = score
            best_pincode = pincode
            
            # Refine the address boundary
            addr_candidate = candidate_block_clean.strip()
            
            # Start after common label tokens
            labels = ["address :", "address:", "address", "contact us :", "contact us:", "contact us", "reach us :", "reach us:", "reach us", "location :", "location:", "location"]
            lower_candidate = addr_candidate.lower()
            for label in labels:
                idx = lower_candidate.rfind(label)
                if idx != -1:
                    addr_candidate = addr_candidate[idx + len(label):].strip()
                    break
            
            # Cut off if it has common prefix delimiters like | or ;
            for sep in ["|", ";", "   "]:
                if sep in addr_candidate:
                    parts = addr_candidate.split(sep)
                    addr_candidate = parts[-1].strip()
            
            # Comma-based segments cleaning to remove navigation menu and description text
            parts = addr_candidate.split(',')
            cleaned_parts = []
            
            for part in parts:
                p_strip = part.strip()
                p_lower = p_strip.lower()
                
                # Check if this part contains garbage keywords
                has_garbage = any(gk in p_lower for gk in garbage_keywords)
                # Check if it has a sentence structure (verbs like is, are, we, to, our)
                has_verbs = any(f" {v} " in f" {p_lower} " for v in ["is", "are", "we", "our", "us", "the", "who", "ready", "challenge", "challenges"])
                # Check word count
                word_count = len(p_strip.split())
                
                if has_garbage or has_verbs or word_count > 12:
                    # Reset cleaned parts: everything before this garbage segment is discarded
                    cleaned_parts = []
                else:
                    cleaned_parts.append(p_strip)
            
            addr_candidate = ", ".join(cleaned_parts)
            
            # Remove any leading punctuation
            addr_candidate = re.sub(r'^[:\s,.-]+', '', addr_candidate).strip()
            
            # Clean up trailing dashes/punctuation
            addr_candidate = re.sub(r'[-\s,.:]+$', '', addr_candidate).strip()
            
            # Final address should include the city and pincode
            if pincode not in addr_candidate:
                addr_candidate = f"{addr_candidate} - {pincode}"
                
            best_candidate = addr_candidate
            
    if best_candidate and len(best_candidate) > 15:
        # Format the address string
        formatted_parts = []
        for part in best_candidate.split(','):
            p = part.strip()
            if p:
                formatted_parts.append(" ".join(w.capitalize() for w in p.split()))
        best_candidate = ", ".join(formatted_parts)
        
        # Extract area name
        area = extract_area_from_address(best_candidate, search_area)
        
        # Phone heuristic: search for 8-11 digit numbers
        phone = ""
        phone_match = re.search(r'\b(0\d{2,4}[-\s]?\d{6,8}|[6-9]\d{9}|\+91[-\s]?\d{10})\b', normalized_text)
        if phone_match:
            phone = phone_match.group(0)
            
        return {
            "address": best_candidate,
            "pincode": best_pincode,
            "area_name": area,
            "contact_number": phone
        }
        
    return {}


def extract_info_from_website_text(text: str, gmaps_address: str, gmaps_phone: str, search_area: str) -> dict:
    """
    Uses Gemini/Groq/Ollama to extract contact number, full address, postal pincode, and local area name
    strictly from website text, falling back to Google Maps data if website doesn't contain them.
    """
    cleaned_text = text[:8000] if text else ""
    default_area = extract_area_from_address(gmaps_address, search_area)
    gmaps_pincode = extract_pincode_from_address(gmaps_address)
    
    fallback_data = {
        "contact_number": gmaps_phone or "N/A",
        "address": gmaps_address or "N/A",
        "pincode": gmaps_pincode,
        "area_name": default_area
    }
    
    if not cleaned_text or ai_provider == "none":
        return fallback_data
        
    prompt = (
        "You are an information extraction assistant. Analyze the following text extracted from a school's website "
        "and find the school's full address, the 6-digit postal pincode, the specific local area/neighborhood name corresponding to that address, and the contact phone number.\n\n"
        "Instructions:\n"
        "1. Extract the school's postal address from the website text. If the website text does not contain a full/postal address, return null in the 'address' field. (Do NOT use Google Maps reference or any other source to guess the address if not in the text).\n"
        "2. Extract the 6-digit postal pincode from the website text. If not found, return null in the 'pincode' field.\n"
        "3. Extract the local area/neighborhood name (e.g. Sholinganallur, Medavakkam, Srirangam, Tambaram, etc.) that the pincode and address refer to. If not found, return null in the 'area_name' field.\n"
        "4. Extract the contact phone number from the website text. If not found, return null in the 'contact_number' field.\n\n"
        "Return the result as a simple JSON object with exactly four keys: 'contact_number', 'address', 'pincode', and 'area_name'.\n"
        f"Website text content:\n{cleaned_text}"
    )
    
    # 1. Try Gemini (Primary if key exists)
    if api_key:
        try:
            model = get_gemini_model()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            data = json.loads(response.text.strip())
            return process_extracted_info(data, gmaps_address, gmaps_phone, gmaps_pincode, default_area, search_area)
        except Exception as e:
            logger.error(f"Gemini failed to extract info from website text, trying Groq fallback: {e}")

    # 2. Try Groq (Fallback or Primary)
    if groq_key:
        try:
            result = query_groq(prompt, is_json=True)
            if result:
                import json
                data = json.loads(result.strip())
                return process_extracted_info(data, gmaps_address, gmaps_phone, gmaps_pincode, default_area, search_area)
        except Exception as e:
            logger.error(f"Groq failed to extract info from website text: {e}")

    # 3. Try Ollama
    if ai_provider == "ollama":
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        try:
            result = query_ollama(prompt, model_name, is_json=True)
            if result:
                import json
                data = json.loads(result.strip())
                return process_extracted_info(data, gmaps_address, gmaps_phone, gmaps_pincode, default_area, search_area)
        except Exception as e:
            logger.error(f"Ollama failed to extract info from website text: {e}")
    # 4. Try Rule-based heuristic fallback if AI failed but text exists
    if cleaned_text:
        try:
            heuristic_data = extract_address_fallback_rules(cleaned_text, search_area)
            if heuristic_data and heuristic_data.get("address"):
                logger.info("AI failed or was unauthorized. Successfully fell back to rule-based address extraction.")
                return {
                    "contact_number": heuristic_data.get("contact_number") or fallback_data["contact_number"],
                    "address": heuristic_data["address"],
                    "pincode": heuristic_data.get("pincode") or fallback_data["pincode"],
                    "area_name": heuristic_data.get("area_name") or fallback_data["area_name"]
                }
        except Exception as he_err:
            logger.error(f"Heuristic fallback address extraction failed: {he_err}")

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
    audit_stats = None
    
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
            
            # Slightly longer timeout with domcontentloaded to avoid load event timeouts on slow school sites
            page.goto(website_url, timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)  # Wait for animations to settle
            screenshot_bytes = page.screenshot(full_page=False)
            
            # Get homepage text and technical audit stats
            homepage_text = page.evaluate("() => document.body.innerText") or ""
            try:
                audit_stats = page.evaluate("""() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const hasSocial = links.some(a => {
                        const href = (a.getAttribute('href') || '').toLowerCase();
                        return href.includes('facebook.com') || href.includes('instagram.com') || href.includes('linkedin.com') || href.includes('youtube.com');
                    });
                    const match = document.body.innerText.match(/\\b(20\\d{2})\\b/);
                    return {
                        title: document.title || "",
                        metaDesc: document.querySelector('meta[name="description"]')?.content || "",
                        hasViewport: !!document.querySelector('meta[name="viewport"]'),
                        textLength: document.body.innerText.length || 0,
                        hasSocialLinks: hasSocial,
                        copyrightYear: match ? match[1] : null
                    };
                }""")
            except Exception as audit_err:
                logger.warning(f"Error executing site audit script: {audit_err}")
            
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
                    page.goto(contact_url, timeout=15000, wait_until="domcontentloaded")
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

    # 3. Handle none provider (generate detailed feedback based on technical audit)
    if ai_provider == "none":
        feedbacks = []
        appearance_res = "Good"
        
        if website_url.startswith("http://"):
            feedbacks.append("Insecure connection (HTTP)")
            appearance_res = "Redesign"
            
        if audit_stats:
            if not audit_stats.get("hasViewport", True):
                feedbacks.append("Lacks mobile responsiveness support")
                appearance_res = "Redesign"
            if not audit_stats.get("metaDesc"):
                feedbacks.append("Missing SEO meta description")
            if audit_stats.get("textLength", 1000) < 600:
                feedbacks.append("Thin content page")
                appearance_res = "Redesign"
            if not audit_stats.get("hasSocialLinks", True):
                feedbacks.append("Missing social media profile links")
            cpy = audit_stats.get("copyrightYear")
            if cpy and int(cpy) < 2025:
                feedbacks.append(f"Outdated copyright year ({cpy})")
                appearance_res = "Redesign"
        else:
            feedbacks.append("Website content loaded incorrectly")
            appearance_res = "Redesign"
            
        if not feedbacks:
            remarks_res = "Website looks modern, secure, and responsive."
        else:
            remarks_res = " | ".join(feedbacks) + ". Suggest layout refresh."
            
        return appearance_res, remarks_res, website_text

    prompt = (
        "You are an expert website designer reviewing school websites to see if they need redesign services. "
        "Look at this screenshot of the school website. "
        "1. Is the design modern, clean, mobile-friendly and professional? Choose either 'Good' or 'Redesign'. "
        "2. Provide a 1-sentence friendly remark recommending what to improve (e.g. 'Need to improve the design, update layout, make mobile friendly' or 'Website looks professional'). "
        "Format your response as a simple JSON object containing keys 'appearance' and 'remarks'. For example:\n"
        '{"appearance": "Redesign", "remarks": "Need to improve the design and update the layout."}'
    )

    # 4. Use Gemini Vision to evaluate screenshot (Primary if key exists)
    if api_key:
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
            logger.error(f"Gemini API failure during web audit, trying Groq fallback: {e}")

    # 5. Use Groq Vision (Fallback or Primary)
    if groq_key:
        try:
            result = query_groq_vision(prompt, screenshot_bytes)
            if result:
                import json
                data = json.loads(result.strip())
                appearance = data.get("appearance", "Redesign")
                remarks = data.get("remarks", "Need to improve the design")
                logger.info(f"Groq Web Audit: {appearance} - {remarks}")
                return appearance, remarks, website_text
        except Exception as e:
            logger.error(f"Groq Vision failure during web audit: {e}")

    # 6. Use Ollama Vision to evaluate screenshot
    if ai_provider == "ollama":
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

    # 4. Analyze image using Gemini (Primary if key exists)
    if api_key:
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
            logger.error(f"Gemini API failure during photo audit, trying Groq fallback: {e}")
            
    # 5. Analyze image using Groq Vision (Fallback or Primary)
    if groq_key:
        try:
            result = query_groq_vision(prompt, img_bytes)
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
            logger.error(f"Groq Vision failure during photo audit: {e}")

    # 6. Analyze image using Ollama Vision
    if ai_provider == "ollama":
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
        return ["srirangam", "thiruvanaikoil", "thiruvanai kovil", "thiruvanai", "koothur", "woraiyur", "chathiram", "chatram", "trichy", "tiruchirappalli"]
    elif "thiruvanaikoil" in area_clean or "thiruvanai kovil" in area_clean:
        return ["thiruvanaikoil", "thiruvanai kovil", "srirangam", "koothur", "trichy", "tiruchirappalli"]
    
    # Chennai regions
    elif "medavakkam" in area_clean:
        return ["medavakkam", "pallikaranai", "kovilambakkam", "nanmangalam", "santhosapuram", "perumbakkam", "vengaivasal", "vengavasal", "selaiyur", "sholinganallur", "semmancheri", "madambakkam", "sithalapakkam"]
    elif "tambaram" in area_clean:
        return ["tambaram", "chromepet", "selaiyur", "chitlapakkam", "irumbuliyur", "mudichur", "peerkankaranai", "perungalathur", "sanatorium", "pallavaram", "vandalur", "vengambakkam", "madambakkam", "hastinapuram", "kovilanchery", "sithalapakkam", "semmancheri", "gowrivakkam", "rajakilpakkam", "kamarajapuram", "camp road"]
    elif "adyar" in area_clean:
        return ["adyar", "thiruvanmiyur", "besant nagar", "ra puram", "mylapore", "velachery", "kotturpuram", "guindy"]
    elif "sholinganallur" in area_clean:
        return ["sholinganallur", "perumbakkam", "semmancheri", "navalur", "karapakkam", "okkiyam", "thoraipakkam", "medavakkam", "utsandi", "kanathur", "panaiyur"]
        
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
