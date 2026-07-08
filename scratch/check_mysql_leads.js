const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'school_leads',
  port: Number(process.env.DB_PORT) || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
  
  connection.query(
    'SELECT id, school_name, social_media, remarks, website_url FROM leads',
    (error, results) => {
      if (error) throw error;
      console.log(`Total leads in MySQL: ${results.length}`);
      results.forEach(row => {
        console.log(`ID: ${row.id} | Name: ${row.school_name} | Social: ${row.social_media} | Website: ${row.website_url} | Remarks: ${row.remarks}`);
      });
      connection.end();
    }
  );
});
