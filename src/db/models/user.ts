import { hash } from '../../helper/hash';
import { comparePasswords } from '../../helper/comparePasswords';
import sql from '../db';
import { blankUser } from '../../data/blankObjects';
import type { User } from '../../typedefs/User';
import { v4 as uuidv4 } from 'uuid';
import { errors } from '../../data/errors';
import type { ReturnObject } from '../../typedefs/ReturnObject';
import type { ErrorType } from '../../typedefs/ErrorType';
import type { Session } from '../../typedefs/Session';
import { toPostgresTimestampUTC } from '../../helper/timestampFunctions';
import db from '../db';

interface GenericUserModelArgs {
  email: string;
  password: string;
}

interface SignupArgs extends GenericUserModelArgs {
  id?: string;
}

const signup = async (args: SignupArgs): Promise<ReturnObject> => {
  const { email, password } = args;

  const id = args.id ? args.id : uuidv4();

  const userExists = await checkUserExists(email);

  if (userExists) {
    return {
      data: null,
      error: errors.userAlreadyExists
    };
  }

  try {
    const encryptedPassword = await hash(password);
    const emailConfirmedAt = toPostgresTimestampUTC(new Date());
    const createdAt = toPostgresTimestampUTC(new Date());
    const updatedAt = toPostgresTimestampUTC(new Date());

    const query = db.prepare('INSERT INTO users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email;');
    const result = query.run(id, email, encryptedPassword, emailConfirmedAt, createdAt, updatedAt);

    return {
      data: result ? { user: { id, email } } : { user: { id: '', email: '' } },
      error: null
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

const login = async (args: GenericUserModelArgs): Promise<ReturnObject> => {
  const { email, password } = args;

  try {
    const userResponse = await getUser(email);

    if (userResponse.error && userResponse.error.code == 'user_not_found') {
      return {
        data: null,
        error: errors.userNotFound
      }
    }

    const user = userResponse.data!;

    const passwordsMatch = await comparePasswords({ inputPassword: password, hash: user.encryptedPassword });

    if (passwordsMatch) {
      return {
        data: { user: { id: user.id, email: user.email } },
        error: null
      }
    } else {
      return {
        data: null,
        error: errors.invalidCredentials
      }
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const getUser = async (email: string): Promise<{ data: { id: string; email: string;  encryptedPassword: string } | null, error: ErrorType | null }> => {
  try {
    const query = db.prepare('SELECT id, email, encrypted_password AS "encryptedPassword" FROM users WHERE email = ?');
    const result = query.get(email);
    const user: User | undefined = result as User | undefined; // Type assertion for safety

    if (!user || user.id === '') {
      return {
        data: null,
        error: errors.userNotFound
      }
    }

    return {
      data: user ? user : blankUser,
      error: null
    }
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const query = db.prepare('SELECT DISTINCT email FROM users WHERE email = ?;');

    const result = query.get(email);
    const user: User | undefined = result as User | undefined;

    return user !== undefined;
  } catch (error) {
    console.error(error);
    return false;
  }
}

const deleteUser = async (id: string): Promise<ReturnObject> => {
  try {
    const query = db.prepare('DELETE FROM users WHERE id = ?;');

    const result = query.run(id);

    return {
      data: null,
      error: null
    }
  } catch (error) {
    console.error(error);

    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

const deleteMultipleUsers = async (ids: string[]) => {
// Preserve original input checks/early returns
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      data: { deleted: 0 },
      error: errors.missingInputs
    };
  }

  // Conservative batch size to stay under SQLite's variable limit.
  // If you know your build sets a different SQLITE_MAX_VARIABLE_NUMBER,
  // adjust this accordingly.
  const BATCH_SIZE = 500;

  // Helper to chunk the input
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    chunks.push(ids.slice(i, i + BATCH_SIZE));
  }

  try {
    let totalDeleted = 0;

    // Wrap all batched statements in a single transaction
    const runTxn = db.transaction(() => {
      for (const chunk of chunks) {
        const placeholders = chunk.map(() => '?').join(',');
        const sql = `DELETE FROM users WHERE id IN (${placeholders});`;
        const stmt = db.prepare(sql);
        const info = stmt.run(...chunk);
        totalDeleted += info.changes ?? 0;
      }
    });

    runTxn(); // execute the transaction

    return { data: { deleted: totalDeleted }, error: null };
  } catch (error) {
    console.error(error);

    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

const deleteAllUsers = async () => {
  try {
    const query = db.prepare('DELETE FROM user;');

    const result = query.run();

    return {
      data: null,
      error: null
    }
  } catch (error) {
    console.error(error);

    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

const changeUserPassword = async (user: User, newPassword: string) => {
  try {
    const encryptedNewPassword = await hash(newPassword);
    const updatedAt = toPostgresTimestampUTC(new Date());
    const encryptedPasswordQuery = db.prepare('UPDATE users SET encrypted_password = ? WHERE id = ?;');
    const encryptedPasswordResult = encryptedPasswordQuery.run(encryptedNewPassword, user.id);

    const updatedAtQuery = db.prepare('UPDATE users SET updated_at = ? WHERE id = ?;');
    const updatedAtResult = updatedAtQuery.run(updatedAt, user.id);

    return {
      data: null,
      error: null
    }
  } catch (error) {
    console.error(error);

    return {
      data: null,
      error: errors.internalServerError
    }
  }
}

export {
  signup,
  login,
  getUser,
  checkUserExists,
  deleteUser,
  deleteMultipleUsers,
  deleteAllUsers,
  changeUserPassword
}
