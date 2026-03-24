import { Hono } from "hono";
import { getTypedEmailPasswordFromBody } from "../helper/getTypedEmailPasswordFromBody";
import { changeUserPassword, emailPasswordLogin, emailPasswordSignup } from "../db/models/emailPasswordAuth";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { createSession, getCurrentSession } from "../session/sessionFunctions";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../typedefs/UserSessionObject";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";

const emailPasswordRoutes = new Hono();

emailPasswordRoutes.post('/login', async (c) => {
  console.log('POST /email-password/login');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const { email, password } = getTypedEmailPasswordFromBody(body);

  try {
    const response = await emailPasswordLogin({ email, password });

    if (response.error) {
      const result = await failure<MockabaseUserReturnObject>(response.error, '/email-password/login');

      return c.json(result);
    }

    const session = createSession(response.data!.session);

    const returnObject = await success<UserSessionObject>({ session });

    return c.json(returnObject);
  } catch (error) {
    const result = await failure<MockabaseUserReturnObject>(error, '/email-password/login');

    return c.json(result);
  }
});

emailPasswordRoutes.post('/signup', async (c) => {
  console.log('POST /email-password/signup');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const { email, password } = getTypedEmailPasswordFromBody(body);

  const id = body['id'] ? body['id'].toString() : uuidv4();

  try {
    const response = await emailPasswordSignup({ id, email, password });

    if (response.error)  {
      const result = await failure<UserSessionObject>(response.error, '/email-password/signup');
      return c.json(result);
    }

    const returnObject = await success<UserSessionObject>(response.data!);
    return c.json(returnObject);
  } catch (error) {
    const result = await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, '/email-password-signup');
    return c.json(result);
  }
});

emailPasswordRoutes.post('/change-password', async (c) => {
  console.log('POST /change-password');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const email = body['email'].toString();
  const newPassword = body['newPassword'].toString();

  try {
    const session = getCurrentSession();

    const changePasswordResult = await changeUserPassword(email, newPassword);

    if (changePasswordResult.error) {
      const result = await failure<null>(changePasswordResult.error, '/email-password/change-password');
      return c.json(result);
    }

    const result = await success<null>(null);
    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, '/email-password/change-password');
    return c.json(result);
  }
});

export {
  emailPasswordRoutes
}