import { hash } from '../../helper/hash';
import { comparePasswords } from '../../helper/comparePasswords';
import { blankSession } from '../../data/blankObjects';
import type { User } from '../../typedefs/User';
import { v4 as uuidv4 } from 'uuid';
import { toPostgresTimestampUTC } from '../../helper/timestampFunctions';
import db from '../db';
import { failure, success, type DataErrorReturnObject } from 'dataerror';
import type { MockabaseUserReturnObject } from '../../typedefs/MockabaseUserReturnObject';
import type { UserSessionObject } from '../../typedefs/UserSessionObject';
import type { Provider } from '../../typedefs/Provider';
import { generateRandomOTP } from '../../helper/generateRandomOTP';
import type { Statement } from 'better-sqlite3';
import type Database from 'better-sqlite3';
import { mockabaseErrors } from '../../data/mockabaseErrors';
import type { GenericUserPhoneArgs } from '../../typedefs/GenericUserPhoneArgs';
import { isValidPhoneNumber } from 'libphonenumber-js';

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

  const userExists = await checkUserExists(email);

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

    if (userResponse.error && userResponse.error.code == 'user_not_found') {
      return await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, 'models/emailPasswordLogin');
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

interface PhoneSignupArgs extends GenericUserPhoneArgs {
  id?: string;
}

const phoneSignup = async (args: PhoneSignupArgs) => {
  const { phoneNumber } = args;

  const id = args.id ? args.id : uuidv4();
  const createdAt = toPostgresTimestampUTC(new Date());
  const updatedAt = toPostgresTimestampUTC(new Date());

  if (!isValidPhoneNumber(phoneNumber)) {
    return await failure<UserSessionObject>(mockabaseErrors.invalidPhoneNumber, 'models/phoneSignup');
  }

  try {
    const query = db.prepare('INSERT INTO users (id, phone_number, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING id, email, phone_number AS "phoneNumber", oauth_provider AS "oauthProvider";');
    const result = query.run(id, phoneNumber, createdAt, updatedAt);

    const data: UserSessionObject = result ? { session: { id, email: null, phoneNumber, providerType: 'phone', oauthProvider: null } } : { session: blankSession };
    return await success<UserSessionObject>(data);
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/phoneSignup');
  }
}

const getUserByEmail = async (email: string): Promise<DataErrorReturnObject<User>> => {
  try {
    const query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE email = ?');
    const result = query.get(email);
    const user: User | undefined = result as User | undefined; // Type assertion for safety

    if (!user || user.id === '') {
      return await failure<User>(mockabaseErrors.userNotFound, 'models/emailPasswordLogin');
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

const deleteUser = async (id: string): Promise<DataErrorReturnObject<null>> => {
  try {
    const query = db.prepare('DELETE FROM users WHERE id = ?;');

    const result = query.run(id);

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/deleteUser');
  }
}

type DeletedCount = { deleted: number };

const deleteMultipleUsers = async (ids: string[]): Promise<DataErrorReturnObject<DeletedCount>> => {
// Preserve original input checks/early returns
  if (!Array.isArray(ids) || ids.length === 0) {
    return await failure<DeletedCount>(mockabaseErrors.missingInputs, 'models/deleteMultipleUsers');
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

    return await success<DeletedCount>({ deleted: totalDeleted });
  } catch (error) {
    return await failure<DeletedCount>(error, 'models/deleteMultipleUsers');
  }
}

const deleteAllUsers = async (): Promise<DataErrorReturnObject<null>> => {
  try {
    const query = db.prepare('DELETE FROM users');

    const result = query.run();

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/deleteAllUsers');
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

interface AssignOTPArgs {
  providerType: Provider;
  email?: string;
  phoneNumber?: string;
}

const assignOTP = async (args: AssignOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber } = args;

  const otp = generateRandomOTP(6);

  try {
    if (providerType === 'phone') {
      const query = db.prepare('UPDATE users SET otp = ? WHERE phone_number = ?');
      const response = query.run(otp, phoneNumber);

      return await success<'ok'>('ok');
    } else {
      const query = db.prepare('UPDATE users SET otp = ? WHERE email = ?');
      const response = query.run(otp, email);

      return await success<'ok'>('ok');
    }
  } catch (error) {
    return await failure<'ok'>(error, 'models/assignOTP');
  }
}

interface VerifyOTPArgs extends AssignOTPArgs {
  otp: string;
}

const verifyOTP = async (args: VerifyOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber, otp } = args;

  let query: Statement<unknown[], unknown>;
  let response: Database.RunResult;

  try {
    if (providerType === 'phone') {
      // TODO: look into using a base query for the SELECTs so they aren't repeated 3 times
      query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE phone_number = ?');
      response = query.run(phoneNumber);
    } else {
      const query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE email = ?');
      response = query.run(email);
    }

    const user: User | undefined = response as unknown as User | undefined; // Type assertion for safety

    if (user!.otp === otp) {
      return await success<'ok'>('ok');
    } else {
      return await failure<'ok'>(mockabaseErrors.invalidOTP, 'models/verifyOTP');
    }

  } catch (error) {
    return await failure<'ok'>(error, 'models/verifyOTP');
  }
}

const clearOTP = async (id: string): Promise<DataErrorReturnObject<null>> => {
  try {
    const query = db.prepare('UPDATE users SET otp = NULL WHERE id = ?')
    const response = query.run(id);

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/clearOTP');
  }
}

export {
  emailPasswordSignup,
  emailPasswordLogin,
  getUserByEmail,
  checkUserExistsByEmail,
  deleteUser,
  deleteMultipleUsers,
  deleteAllUsers,
  changeUserPassword,
  assignOTP,
  verifyOTP,
  clearOTP
}
