import sys
import os

sys.path.append(os.path.abspath('backend_python'))
from classifier import evaluate_website_screenshot

url = "https://www.sanacademy.edu.in/"
print(f"Checking index of phone numbers in text for: {url}...")

appearance, remarks, website_text, resolved_url = evaluate_website_screenshot(url)
print("\n--- WEBSITE TEXT LENGTH ---")
print(len(website_text))

idx_landline = website_text.find("044-4855-9601")
idx_mobile = website_text.find("9962301111")

print(f"Index of '044-4855-9601': {idx_landline}")
print(f"Index of '9962301111': {idx_mobile}")

print("\n--- TEXT AROUND LANDLINE (if found) ---")
if idx_landline != -1:
    print(website_text[max(0, idx_landline - 100):idx_landline + 100])
