import type { MockabaseUserReturnObject } from "../../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from 'uuid';
import { comparePasswords } from '../../helper/comparePasswords';
import { hash } from '../../helper/hash';
import { success, failure, type DataErrorReturnObject } from "dataerror";
import type { UserSessionObject } from '../../typedefs/UserSessionObject';
import { toPostgresTimestampUTC } from '../../helper/timestampFunctions';
import { mockabaseErrors } from "../../data/mockabaseErrors";
import db from "../db";
import { blankSession } from "../../data/blankObjects";
import type { User } from "../../typedefs/User";

interface GenericUserPasswordEmailArgs {
  email: string;
  password: string;
}

interface SignupArgs extends GenericUserPasswordEmailArgs {
  id?: string;
}

const emailPasswordSignup = async (args: SignupArgs): Promise<MockabaseUserReturnObject> => {
  const { email, password } = args;

  const id = args.id ? args.id : uuidv4();

  const userExists = await checkUserExistsByEmail(email);

  if (userExists) {
    return await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, 'models/emailPasswordSignup');
  }

  try {
    const encryptedPassword = await hash(password);
    const emailConfirmedAt = toPostgresTimestampUTC(new Date());
    const createdAt = toPostgresTimestampUTC(new Date());
    const updatedAt = toPostgresTimestampUTC(new Date());

    const query = db.prepare('INSERT INTO users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email, phone_number AS "phoneNumber", oauth_provider AS "oauthProvider";');
    const result = query.run(id, email, encryptedPassword, emailConfirmedAt, createdAt, updatedAt);

    const data: UserSessionObject = result ? { session: { id, email, phoneNumber: null, providerType: 'email-password', oauthProvider: null } } : { session: blankSession };
    return await success<UserSessionObject>(data);
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/emailPasswordSignup');
  }
}

const emailPasswordLogin = async (args: GenericUserPasswordEmailArgs): Promise<MockabaseUserReturnObject> => {
  const { email, password } = args;

  try {
    const userResponse = await getUserByEmail(email);

    if (userResponse.error) {
      return await failure<UserSessionObject>(userResponse.error, 'models/emailPasswordLogin');
    }

    const user = userResponse.data!;

    const passwordsMatch = await comparePasswords({ inputPassword: password, hash: user.encryptedPassword! });

    if (passwordsMatch) {
      return await success<UserSessionObject>({ session: { id: user.id, email: user.email!, phoneNumber: null, providerType: 'email-password', oauthProvider: null } });
    } else {
      return await failure<UserSessionObject>(mockabaseErrors.invalidCredentials, 'models/emailPasswordLogin');
    }
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/emailPasswordLogin');
  }
}

const changeUserPassword = async (email: string, newPassword: string): Promise<DataErrorReturnObject<null>> => {
  try {
    const encryptedNewPassword = await hash(newPassword);
    const updatedAt = toPostgresTimestampUTC(new Date());
    const encryptedPasswordQuery = db.prepare('UPDATE users SET encrypted_password = ? WHERE email = ?;');
    const encryptedPasswordResult = encryptedPasswordQuery.run(encryptedNewPassword, email);

    const updatedAtQuery = db.prepare('UPDATE users SET updated_at = ? WHERE email = ?');
    const updatedAtResult = updatedAtQuery.run(updatedAt, email);

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/changeUserPassword');
  }
}

const getUserByEmail = async (email: string): Promise<DataErrorReturnObject<User>> => {
  try {
    const query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE email = ?');
    const result = query.get(email);
    const user: User | undefined = result as User | undefined; // Type assertion for safety

    if (!user || user.id === '') {
      return await failure<User>(mockabaseErrors.userNotFound, 'models/emailPasswordAuth/getUserByEmail');
    }

    return await success<User>(user);
  } catch (error) {
    return await failure<User>(error, 'models/emailPasswordLogin');
  }
}

const checkUserExistsByEmail = async (email: string): Promise<boolean> => {
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
export {
  emailPasswordSignup,
  emailPasswordLogin,
  changeUserPassword,
  getUserByEmail,
  checkUserExistsByEmail
}