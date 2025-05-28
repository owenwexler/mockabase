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
    const result = await sql<User[]>`INSERT INTO users (id, email, encrypted_password) VALUES (${id}, ${email}, ${encryptedPassword}) RETURNING id, email;`;
    return {
      data: result ? { user: { id: result[0].id, email: result[0].email } } : { user: { id: '', email: '' } },
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
    const response = await sql<User[]>`SELECT id, email, encrypted_password AS "encryptedPassword" FROM users WHERE email = ${email};`;

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
