import { Hono } from "hono";
import { phoneLogin, phoneSignup } from "../db/models/phoneAuth";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { createSession } from "../session/sessionFunctions";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../typedefs/UserSessionObject";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import { v4 as uuidv4 } from "uuid";

const phoneRoutes = new Hono();

phoneRoutes.post('/login', async (c) => {
  console.log('POST /phone/login');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const phoneNumber = body['phoneNumber'].toString();

  try {
    const response = await phoneLogin({ phoneNumber });

    if (response.error) {
      const result = await failure<MockabaseUserReturnObject>(response.error, '/phone/login');
      return c.json(result);
    }

    // db model checks for missing OTP

    const result = response.data!;

    const session = createSession(result.session);

    const returnObject = await success<UserSessionObject>({ session });

    return c.json(returnObject);
  } catch (error) {
    const result = await failure<MockabaseUserReturnObject>(error, '/phone/login');
    return c.json(result);
  }
});

phoneRoutes.post('/signup', async (c) => {
  console.log('POST /phone/signup');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const phoneNumber = body['phoneNumber'].toString();

  const id = body['id'] ? body['id'].toString() : uuidv4();

  const staticOTP = body['staticOTP'] ? body['staticOTP'].toString() : null;

  try {
    const result = await phoneSignup({ id, phoneNumber, staticOTP });
    // OTP is also generated inside of the signup function

    if (result.error) {
      const result = await failure<UserSessionObject>(mockabaseErrors.userAlreadyExists, '/phone/signup');
      return c.json(result);
    }

    const returnObject = await success<UserSessionObject>(result.data!);
    return c.json(returnObject);
  } catch (error) {
    const result = await failure<UserSessionObject>(error, '/phone/signup');
    return c.json(result);
  }
});

export {
  phoneRoutes
}