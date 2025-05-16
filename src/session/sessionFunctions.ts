import type { Session } from "../typedefs/Session";
import type { User } from "../typedefs/User";
import fs from 'fs';

const createSession = (userData: Session) => {
  try {
    fs.writeFileSync('session.json', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const getCurrentSession = (): Session => {
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
