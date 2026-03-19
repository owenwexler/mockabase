import Database from 'better-sqlite3';
import { readFileSync } from 'fs';

const db = new Database('mockabase.sqlite'); // Connect to or create a database file

// Enable WAL journal mode for better performance (optional but recommended)
db.pragma('journal_mode = WAL');

// Run schema
const schemaPath = "./src/sql/schema.sql";
const schemaSql = readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

export default db;