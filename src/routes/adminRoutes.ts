import { Hono } from "hono";
import type { UserSessionObject } from "../typedefs/UserSessionObject";
import { failure, success } from "dataerror";
import { deleteAllUsers, deleteMultipleUsers, deleteUser, emailPasswordSignup } from "../db/models/delete";

const adminRoutes = new Hono();

adminRoutes.post('/seed', async (c) => {
  console.log('POST /seed');
  const body = await c.req.json();

  try {
    const promises = [];

    for (const obj of body) {
      const { id, email, password } = obj;

      promises.push(emailPasswordSignup({ id, email, password }));
    }

    const responses = await Promise.allSettled(promises);

    const filteredResponses = responses.filter(obj => obj.status === 'fulfilled');

    const data: UserSessionObject[] = filteredResponses.map(obj => {
      const { id, email, phoneNumber, providerType, oauthProvider } = obj.value.data!.session;
      return {
        session : {
          id,
          email,
          phoneNumber,
          providerType,
          oauthProvider
        }
      }
    });

    const result = await success<UserSessionObject[]>(data);
    return c.json(result);
  } catch (error) {
    console.error(error);
    const result = await failure<UserSessionObject[]>(error, '/seed');
    return c.json(result);
  }
});

adminRoutes.delete('/delete-user/:userId', async (c) => {
  const { userId } = c.req.param();
  console.log(`POST /admin/delete-user/${userId}`)

  try {
    await deleteUser(userId);

    const result = await success<null>(null);

    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, 'routes/admin/delete-user');
    return c.json(result);
  }
});

adminRoutes.delete('/delete-multiple-users', async (c) => {
  console.log('POST /admin/delete-multiple-users');

  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const userIds = body;

  try {
    await deleteMultipleUsers(userIds);

    const result = await success<null>(null);

    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, 'routes/admin/delete-multiple-users');
    return c.json(result);
  }
});

adminRoutes.delete('/clear', async (c) => {
  console.log('POST /admin/clear');

  try {
    await deleteAllUsers();

    const result = await success<null>(null);

    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, 'routes/admin/delete-multiple-users');
    return c.json(result);
  }
});

export {
  adminRoutes
}