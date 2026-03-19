import { Hono } from "hono";
import { emailPasswordLogin } from "../db/models/user";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { createSession } from "../session/sessionFunctions";

const oauthRoutes = new Hono();

const { MOCK_OAUTH_EMAIL, MOCK_OAUTH_PASSWORD } = process.env;

oauthRoutes.post('/:provider', async (c) => {
  const { provider } = c.req.param();

  console.log(`POST /oauth/${provider}`);

  const hasOAuthVariables = (MOCK_OAUTH_EMAIL && MOCK_OAUTH_EMAIL !== '') && (MOCK_OAUTH_PASSWORD && MOCK_OAUTH_PASSWORD !== '');

  if (!hasOAuthVariables) {
    return c.json({
      data: null,
      error: 'No OAuth Found'
    })
  }

  const result = await emailPasswordLogin({ email: MOCK_OAUTH_EMAIL!, password: MOCK_OAUTH_PASSWORD! });

  if (result.error && result.error.code === mockabaseErrors.invalidCredentials.code) {
    return c.json({
      data: null,
      error: mockabaseErrors.invalidCredentials
    });
  }

  if (result.error && result.error.code === mockabaseErrors.userNotFound.code) {
    return c.json({
      data: null,
      error: mockabaseErrors.userNotFound
    });
  }

  const session = createSession(result.data!.session);

  return c.json({
    data: { session },
    error: null
  });
});
export {
  oauthRoutes
}
