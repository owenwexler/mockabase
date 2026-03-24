import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'fs';
import * as schema from './schema.js';

const sqlite = new Database('mockabase.sqlite');
sqlite.pragma('journal_mode = WAL');

const schemaPath = './src/sql/schema.sql';
const schemaSql = readFileSync(schemaPath, 'utf-8');
sqlite.exec(schemaSql);

const db = drizzle(sqlite, { schema });

export default db;