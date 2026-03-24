import { Hono } from "hono";
import { emailPasswordlessLogin, emailPasswordlessSignup } from "../db/models/emailPasswordlessAuth";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { createSession } from "../session/sessionFunctions";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../typedefs/UserSessionObject";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";

const emailPasswordlessRoutes = new Hono();

emailPasswordlessRoutes.post('/login', async (c) => {
  console.log('POST /email-passwordless/login');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const email = body['email'].toString();

  try {
    const response = await emailPasswordlessLogin({ email });

    if (response.error) {
      const result = await failure<MockabaseUserReturnObject>(response.error, '/email-passwordless/login');
      return c.json(result);
    }

    const result = response.data!;

    const session = createSession(result.session);

    const returnObject = await success<UserSessionObject>({ session });

    return c.json(returnObject);
  } catch (error) {
    const result = await failure<MockabaseUserReturnObject>(error, '/email-passwordless/login');
    return c.json(result);
  }
});

emailPasswordlessRoutes.post('/signup', async (c) => {
  console.log('POST /email-passwordless/signup');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const email = body['email'].toString();
  const id = body['id'] ? body['id'].toString() : uuidv4();
  const staticOTP = body['staticOTP'] ? body['staticOTP'].toString() : null;

  try {
    const result = await emailPasswordlessSignup({ id, email, staticOTP });
    // OTP is also generated inside of the signup function

    if (result.error) {
      const result = await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, '/email-passwordless/signup');
      return c.json(result);
    }

    const returnObject = await success<UserSessionObject>(result.data!);
    return c.json(returnObject);
  } catch (error) {
    const result = await failure<UserSessionObject>(error, '/email-passwordless/signup');
    return c.json(result);
  }
});

export {
  emailPasswordlessRoutes
}
