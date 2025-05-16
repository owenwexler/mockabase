import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('Missing DB URL');
}

const dbUrl = process.env.POSTGRES_URL!;

const sql = postgres(dbUrl);

export default sql;
