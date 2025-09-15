import Database from 'better-sqlite3';

const db = new Database('mockabase.sqlite'); // Connect to or create a database file

// id is a UUID and email_confirmed_at, created_at, and updated_at are timestamps, but these data types are not supported by SQLite
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    email_confirmed_at TEXT
    created_at TEXT,
    updated_at TEXT
  );
`);

export default db;
// import postgres from 'postgres';

// if (!process.env.POSTGRES_URL) {
//   throw new Error('Missing DB URL');
// }

// const dbUrl = process.env.POSTGRES_URL!;

// const sql = postgres(dbUrl);

// export default sql;
