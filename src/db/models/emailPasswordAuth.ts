import type { MockabaseUserReturnObject } from "../../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from 'uuid';
import { comparePasswords } from '../../helper/comparePasswords';
import { hash } from '../../helper/hash';
import { success, failure, type DataErrorReturnObject } from "dataerror";
import type { UserSessionObject } from '../../typedefs/UserSessionObject';
import { toPostgresTimestampUTC } from '../../helper/timestampFunctions';
import { mockabaseErrors } from "../../data/mockabaseErrors";
import db from "../db";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
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

    const result = db.insert(users).values({ id, email, encryptedPassword, emailConfirmedAt, createdAt, updatedAt }).run();

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

    db.update(users).set({ encryptedPassword: encryptedNewPassword, updatedAt }).where(eq(users.email, email)).run();

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/changeUserPassword');
  }
}

const getUserByEmail = async (email: string): Promise<DataErrorReturnObject<User>> => {
  try {
    const result = db.select({
      id: users.id,
      email: users.email,
      phoneNumber: users.phoneNumber,
      providerType: users.providerType,
      encryptedPassword: users.encryptedPassword,
      otp: users.otp,
    }).from(users).where(eq(users.email, email)).all();

    const user: User | undefined = result[0] as User | undefined;

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
    const result = db.select({ email: users.email }).from(users).where(eq(users.email, email)).all();

    return result.length > 0;
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
