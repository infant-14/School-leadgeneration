import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
provider = os.getenv("AI_PROVIDER")

print("=" * 50)
print("GEMINI API DIAGNOSTICS")
print("=" * 50)
print(f"AI Provider: {provider}")
if api_key:
    # Print prefix/suffix of the key to keep it secure
    masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "Too short"
    print(f"Gemini API Key: {masked_key}")
else:
    print("Gemini API Key: NOT FOUND!")
    print("\nPlease set GEMINI_API_KEY and AI_PROVIDER=gemini in backend/.env before running.")
    sys.exit(1)

try:
    print("\nConfiguring google-generativeai client...")
    genai.configure(api_key=api_key)
    
    print("Testing connection with 'gemini-2.0-flash'...")
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    response = model.generate_content("Hello! Confirm that you are working by replying with 'Gemini is online!'.")
    print(f"\nResponse from Gemini: {response.text.strip()}")
    print("=" * 50)
    print("SUCCESS: Your Gemini API is working and ready to use!")
    print("=" * 50)
except Exception as e:
    print("\n" + "!" * 50)
    print("ERROR testing Gemini API:")
    print(e)
    print("!" * 50)
