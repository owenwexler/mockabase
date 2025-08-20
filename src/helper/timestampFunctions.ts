/**
 * Converts a JavaScript Date object to a Postgres timestamp string in UTC.
 * Format: YYYY-MM-DD HH:MM:SS (UTC)
 */
const toPostgresTimestampUTC = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1); // months are zero-based
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Converts a Postgres timestamp string (UTC) to a JavaScript Date object.
 * Expected format: YYYY-MM-DD HH:MM:SS
 */
const fromPostgresTimestampUTC = (timestamp: string): Date => {
  const [datePart, timePart] = timestamp.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  // Date.UTC() creates a timestamp in milliseconds for UTC time
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
};

export {
  toPostgresTimestampUTC,
  fromPostgresTimestampUTC
}
