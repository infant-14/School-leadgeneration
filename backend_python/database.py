import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "school_leads.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    logger.info(f"Initializing SQLite database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            school_name TEXT UNIQUE,
            website_url TEXT,
            contact_number TEXT,
            area_name TEXT,
            institution_type TEXT,
            appearance TEXT,
            remarks TEXT,
            atmosphere TEXT,
            social_media TEXT,
            google_rating TEXT,
            photo_url TEXT,
            status TEXT DEFAULT 'New Lead',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_or_update_lead(lead: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if lead already exists
        cursor.execute("SELECT id, status FROM leads WHERE school_name = ?", (lead["school_name"],))
        existing = cursor.fetchone()
        
        if existing:
            # Update except the pipeline status (preserve user overrides in UI)
            cursor.execute("""
                UPDATE leads
                SET website_url = ?,
                    contact_number = ?,
                    area_name = ?,
                    institution_type = ?,
                    appearance = ?,
                    remarks = ?,
                    atmosphere = ?,
                    social_media = ?,
                    google_rating = ?,
                    photo_url = ?
                WHERE id = ?
            """, (
                lead.get("website_url", ""),
                lead.get("contact_number", ""),
                lead.get("area_name", ""),
                lead.get("institution_type", "Matriculation"),
                lead.get("appearance", "Redesign"),
                lead.get("remarks", ""),
                lead.get("atmosphere", "Good"),
                lead.get("social_media", "Inactive"),
                lead.get("google_rating", ""),
                lead.get("photo_url", ""),
                existing["id"]
            ))
            logger.info(f"Updated existing lead: {lead['school_name']}")
        else:
            # Insert new lead
            cursor.execute("""
                INSERT INTO leads (
                    school_name, website_url, contact_number, area_name, 
                    institution_type, appearance, remarks, atmosphere, 
                    social_media, google_rating, photo_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead')
            """, (
                lead["school_name"],
                lead.get("website_url", ""),
                lead.get("contact_number", ""),
                lead.get("area_name", ""),
                lead.get("institution_type", "Matriculation"),
                lead.get("appearance", "Redesign"),
                lead.get("remarks", ""),
                lead.get("atmosphere", "Good"),
                lead.get("social_media", "Inactive"),
                lead.get("google_rating", ""),
                lead.get("photo_url", ""),
            ))
            logger.info(f"Inserted new lead: {lead['school_name']}")
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving lead to database: {e}")
        conn.rollback()
    finally:
        conn.close()

def get_all_leads(search_query: str = None, status_filter: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    
    if search_query:
        query += " AND (school_name LIKE ? OR area_name LIKE ? OR remarks LIKE ?)"
        like_str = f"%{search_query}%"
        params.extend([like_str, like_str, like_str])
        
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)
        
    query += " ORDER BY id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_lead_status(lead_id: int, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE leads SET status = ? WHERE id = ?", (status, lead_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to update lead status: {e}")
        return False
    finally:
        conn.close()

def delete_lead(lead_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to delete lead: {e}")
        return False
    finally:
        conn.close()
