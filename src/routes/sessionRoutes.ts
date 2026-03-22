import { Hono } from "hono";
import { getCurrentSession, removeSession } from "../session/sessionFunctions";
import { failure, success } from "dataerror";
import type { UserSessionObject } from "../typedefs/UserSessionObject";

const sessionRoutes = new Hono();

sessionRoutes.post('/logout', async (c) => {
  console.log('POST /session/logout');
  try {
    const session = removeSession();

    const result = await success<null>(null);

    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, 'routes/session/logout');
    return c.json(result);
  }
});

sessionRoutes.get('/get-current-session', async (c) => {
  console.log('POST /session/get-current-session');
  try {
    const session = getCurrentSession();

    const result = await success<UserSessionObject>(session);

    return c.json(result);
  } catch (error) {
    const result = await failure<UserSessionObject>(error, 'routes/session/logout');
    return c.json(result);
  }
});

export {
  sessionRoutes
}