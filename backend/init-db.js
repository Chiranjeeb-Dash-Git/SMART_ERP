
const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    
    // Read the schema
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📜 Executing database schema...');
    
    // Execute the entire schema at once
    await client.query(schema);
    
    console.log('🎉 Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error initializing database:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

initDatabase();
