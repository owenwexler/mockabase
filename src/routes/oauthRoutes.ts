import { Hono } from "hono";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { createSession } from "../session/sessionFunctions";
import { oauthSignup, oauthLogin } from "../db/models/oauth";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../typedefs/UserSessionObject";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import type { OAuthProvider } from "../typedefs/OAuthProvider";
import { v4 as uuidv4 } from "uuid";

const oauthRoutes = new Hono();

oauthRoutes.post('/signup/:provider', async (c) => {
  console.log('POST /oauth/signup/:provider');
  const { provider } = c.req.param();

  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const email = body['email'].toString();
  const oauthProvider = provider as OAuthProvider;
  const id = body['id'] ? body['id'].toString() : uuidv4();

  try {
    const response = await oauthSignup({ id, email, oauthProvider });

    if (response.error) {
      const result = await failure<UserSessionObject>(response.error, '/oauth/signup');
      return c.json(result);
    }

    const returnObject = await success<UserSessionObject>(response.data!);
    return c.json(returnObject);
  } catch (error) {
    const result = await failure<MockabaseUserReturnObject>(error, '/oauth/signup');
    return c.json(result);
  }
});

oauthRoutes.post('/login/:provider', async (c) => {
  console.log('POST /oauth/login/:provider');
  const { provider } = c.req.param();

  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const email = body['email'].toString();
  const oauthProvider = provider as OAuthProvider;

  try {
    const result = await oauthLogin({ email, oauthProvider });

    if (result.error && result.error.code === mockabaseErrors.userNotFound.code) {
      const result = await failure<MockabaseUserReturnObject>(mockabaseErrors.userNotFound, '/oauth/login');
      return c.json(result);
    }

    const session = createSession(result.data!.session);
    const returnObject = await success<UserSessionObject>({ session });
    return c.json(returnObject);
  } catch (error) {
    const result = await failure<MockabaseUserReturnObject>(error, '/oauth/login');
    return c.json(result);
  }
});

export {
  oauthRoutes
}
