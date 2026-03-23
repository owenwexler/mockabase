import type { MockabaseUserReturnObject } from "../../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";
import { checkUserExistsByEmail, getUserByEmail } from "./emailPasswordAuth";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../../typedefs/UserSessionObject";
import { mockabaseErrors } from "../../data/mockabaseErrors";
import { generateRandomOTP } from "../../helper/generateRandomOTP";
import { toPostgresTimestampUTC } from "../../helper/timestampFunctions";
import db from "../db";
import { users } from "../schema.js";
import { blankSession } from "../../data/blankObjects";
import { clearOtp } from "./otp";
import type { EmailPasswordlessSignupArgs } from "../../typedefs/EmailPasswordlessSignupArgs";

const emailPasswordlessSignup = async (args: EmailPasswordlessSignupArgs
): Promise<MockabaseUserReturnObject> => {
  const { email } = args;

  const emailConfirmedAt = toPostgresTimestampUTC(new Date());
  const createdAt = toPostgresTimestampUTC(new Date());
  const updatedAt = toPostgresTimestampUTC(new Date());

  const id = args.id ? args.id : uuidv4();

  const otp = args.staticOTP ? args.staticOTP : generateRandomOTP(6);

  const userExists = await checkUserExistsByEmail(email);

  if (userExists) {
    return await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, 'models/emailPasswordSignup');
  }

  try {
    const result = db.insert(users).values({ id, email, otp, emailConfirmedAt, createdAt, updatedAt }).run();

    const data: UserSessionObject = result ? { session: { id, email, phoneNumber: null, providerType: 'email-passwordless', oauthProvider: null } } : { session: blankSession };
    return await success<UserSessionObject>(data);
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/emailPasswordlessSignup');
  }
}

const emailPasswordlessLogin = async (args: EmailPasswordlessSignupArgs): Promise<MockabaseUserReturnObject> => {
  const { email } = args;

  try {
    const userResponse = await getUserByEmail(email);

    if (userResponse.error) {
      return await failure<UserSessionObject>(userResponse.error, 'models/emailPasswordLogin');
    }

    const user = userResponse.data!;

    if (!user.otp) {
      return await failure<UserSessionObject>(mockabaseErrors.missingOTP, 'models/emailPasswordlessAuth/emailPasswordlessLogin');
    }

    // clear the OTP once successfully logged in
    await clearOtp(user.id);

    return await success<UserSessionObject>({ session: { id: user.id, email: user.email!, phoneNumber: null, providerType: 'email-passwordless', oauthProvider: null } });
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/emailPasswordlessAuth/emailPasswordlessLogin');
  }
}

export {
  emailPasswordlessSignup,
  emailPasswordlessLogin
}
