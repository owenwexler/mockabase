import type { MockabaseUserReturnObject } from "../../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";
import { checkUserExistsByEmail, getUserByEmail } from "./emailPasswordAuth";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../../typedefs/UserSessionObject";
import { mockabaseErrors } from "../../data/mockabaseErrors";
import { toPostgresTimestampUTC } from "../../helper/timestampFunctions";
import db from "../db";
import { blankSession } from "../../data/blankObjects";
import type { OAuthProvider } from "../../typedefs/OAuthProvider";

interface OAuthArgs {
  email: string;
  oauthProvider: OAuthProvider;
  id?: string;
}

const oauthSignup = async (args: OAuthArgs): Promise<MockabaseUserReturnObject> => {
  const { email, oauthProvider } = args;

  const id = args.id ? args.id : uuidv4();

  const userExists = await checkUserExistsByEmail(email);

  if (userExists) {
    return await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, 'models/oauthSignup');
  }

  try {
    const emailConfirmedAt = toPostgresTimestampUTC(new Date());
    const createdAt = toPostgresTimestampUTC(new Date());
    const updatedAt = toPostgresTimestampUTC(new Date());

    const query = db.prepare('INSERT INTO users (id, email, oauth_provider, provider_type, email_confirmed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, email, phone_number AS "phoneNumber", oauth_provider AS "oauthProvider";');
    const result = query.run(id, email, oauthProvider, 'oauth', emailConfirmedAt, createdAt, updatedAt);

    const data: UserSessionObject = result ? { session: { id, email, phoneNumber: null, providerType: 'oauth', oauthProvider } } : { session: blankSession };
    return await success<UserSessionObject>(data);
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/oauthSignup');
  }
}

const oauthLogin = async (args: OAuthArgs): Promise<MockabaseUserReturnObject> => {
  const { email, oauthProvider } = args;

  try {
    const userResponse = await getUserByEmail(email);

    if (userResponse.error) {
      return await failure<UserSessionObject>(userResponse.error.code === 'user_not_found' ? mockabaseErrors.userNotFound : userResponse.error, 'models/oauthLogin');
    }

    const user = userResponse.data!;

    if (user.oauthProvider !== oauthProvider) {
      return await failure<UserSessionObject>(mockabaseErrors.badOAuthCallback, 'models/oauthLogin');
    }

    return await success<UserSessionObject>({ session: { id: user.id, email: user.email!, phoneNumber: null, providerType: 'oauth', oauthProvider } });
  } catch (error) {
    return await failure<UserSessionObject>(error, 'models/oauthLogin');
  }
}

export {
  oauthSignup,
  oauthLogin
}
