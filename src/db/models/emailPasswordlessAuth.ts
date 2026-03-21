import type { MockabaseUserReturnObject } from "../../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";
import { checkUserExistsByEmail, getUserByEmail } from "./emailPasswordAuth";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../../typedefs/UserSessionObject";
import { mockabaseErrors } from "../../data/mockabaseErrors";
import { generateRandomOTP } from "../../helper/generateRandomOTP";
import { toPostgresTimestampUTC } from "../../helper/timestampFunctions";
import db from "../db";
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
    const query = db.prepare('INSERT INTO users (id, email, otp, email_confirmed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email, phone_number AS "phoneNumber", oauth_provider AS "oauthProvider";');
    const result = query.run(id, email, otp, emailConfirmedAt, createdAt, updatedAt);

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

    if (userResponse.error && userResponse.error.code == 'user_not_found') {
      return await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, 'models/emailPasswordLogin');
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