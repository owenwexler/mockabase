import type { Session } from "../typedefs/Session";
import fs from 'fs';

const createSession = (session: Session) => {
  try {
    fs.writeFileSync('session.json', JSON.stringify({ session }));
    return session;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const getCurrentSession = (): { session: Session } => {
  try {
    const session = fs.readFileSync('session.json').toString();
    return JSON.parse(session);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const removeSession = () => {
  try {
    fs.writeFileSync('session.json', JSON.stringify(null));
    return null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export {
  createSession,
  getCurrentSession,
  removeSession
}
