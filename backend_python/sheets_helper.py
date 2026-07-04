import os
import sys
import argparse
import sqlite3
from dotenv import load_dotenv

# Load environment (checks root or backend/.env)
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

# Import the existing Excel and Sheets sync modules
from sheets import save_leads_to_excel, sync_to_google_sheets

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "school_leads.db")

def get_db_leads():
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return []
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM leads ORDER BY id DESC")
        rows = cursor.fetchall()
        leads = [dict(row) for row in rows]
        return leads
    except Exception as e:
        print(f"Error querying database: {e}")
        return []
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="Helper script to handle Excel exports and Google Sheets sync for NestJS backend")
    parser.add_argument("--action", type=str, required=True, choices=["download", "sync"], help="Action to perform: download or sync")
    parser.add_argument("--file", type=str, default="", help="Optional JSON file containing leads list")
    
    args = parser.parse_args()
    
    leads = []
    if args.file and os.path.exists(args.file):
        import json
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                leads = json.load(f)
            print(f"Loaded {len(leads)} leads from JSON file.")
        except Exception as e:
            print(f"Error reading JSON file {args.file}: {e}")
            sys.exit(1)
    else:
        leads = get_db_leads()
        
    if not leads:
        print("No leads found.")
        sys.exit(0)
        
    if args.action == "download":
        temp_filename = "school_leads_export.xlsx"
        print(f"Generating Excel spreadsheet: {temp_filename}")
        excel_path = save_leads_to_excel(leads, temp_filename)
        if excel_path:
            print(f"SUCCESS: Generated Excel at {excel_path}")
        else:
            print("ERROR: Failed to generate Excel workbook")
            sys.exit(1)
            
    elif args.action == "sync":
        sheet_id = os.getenv("GOOGLE_SHEET_ID")
        if not sheet_id:
            print("ERROR: GOOGLE_SHEET_ID is not configured in workspace environment (.env)")
            sys.exit(1)
            
        print(f"Syncing {len(leads)} leads to Google Sheets (ID: {sheet_id})...")
        success = sync_to_google_sheets(leads, sheet_id)
        if success:
            print("SUCCESS: Google Sheets sync complete!")
        else:
            print("ERROR: Google Sheets sync failed")
            sys.exit(1)

if __name__ == "__main__":
    main()
