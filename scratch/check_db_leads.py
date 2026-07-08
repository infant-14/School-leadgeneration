import sqlite3
import os

db_path = r"d:\Project\Infanta\School-leadgeneration\school_leads.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, school_name, social_media, remarks FROM leads")
    rows = cursor.fetchall()
    print(f"Total leads in SQLite database: {len(rows)}")
    for row in rows:
        print(f"ID: {row['id']} | Name: {row['school_name']} | Social: {row['social_media']} | Remarks: {row['remarks']}")
    conn.close()
else:
    print("Database file does not exist at path.")
