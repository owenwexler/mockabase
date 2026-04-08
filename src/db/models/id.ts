import db from '../db';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { failure, success, type DataErrorReturnObject } from 'dataerror';
import { mockabaseErrors } from '../../data/mockabaseErrors';

type UserIdObject = { id: string };

const getIdByEmail = async (email: string): Promise<DataErrorReturnObject<UserIdObject>> => {
  try {
    const result = db.select({ id: users.id }).from(users).where(eq(users.email, email)).all();

    const user: UserIdObject | undefined = result[0] as UserIdObject | undefined;

    if (!user || user.id === '') {
      return await failure<UserIdObject>(mockabaseErrors.userNotFound, 'models/getIdByEmail');
    }

    return await success<UserIdObject>(user);
  } catch (error) {
    return await failure<UserIdObject>(error, 'models/getIdByEmail');
  }
}

export {
  getIdByEmail
}
