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
    console.log(result);

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
    const result = query.run(email);
    const user: User | undefined = result.get(1) as User | undefined; // Type assertion for safety

    if (response.length <= 0) {
      return {
        data: null,
        error: errors.userNotFound
      }
    }

    return {
      data: response ? response[0] : blankUser,
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
    const response = await sql`SELECT DISTINCT email FROM users WHERE email = ${email};`;

    return response.length > 0;
  } catch (error) {
    console.error(error);
    return false;
  }
}

const deleteUser = async (id: string): Promise<ReturnObject> => {
  try {
    await sql`DELETE FROM users WHERE id = ${id}`;

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
  try {
    await sql`DELETE FROM users WHERE id IN (SELECT id FROM users WHERE id = ANY(${ids}::uuid[]));`;

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

const deleteAllUsers = async () => {
  try {
    await sql`DELETE FROM users;`;

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
  deleteAllUsers
}
