import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { v4 as uuidv4 } from 'uuid';

import { checkUserExists, deleteAllUsers, deleteMultipleUsers, deleteUser, login, signup } from './db/models/user';
import { createSession, getCurrentSession, removeSession } from './session/sessionFunctions';
import { getTypedEmailPasswordFromBody } from './helper/getTypedEmailPasswordFromBody';

const { PORT, MOCK_OAUTH_EMAIL, MOCK_OAUTH_PASSWORD } = process.env;

const app = new Hono();

app.get('/', (c) => {
  console.log('GET /');
  return c.text('Pick a route');
})

app.post('/seed', async (c) => {
  console.log('POST /seed');
  const body = await c.req.json();

  try {
    const promises = [];

    for (const obj of body) {
      const { id, email, password } = obj;

      promises.push(signup({ id, email, password }));
    }

    const responses = await Promise.allSettled(promises);

    const filteredResponses = responses.filter(obj => obj.status === 'fulfilled');

    const data = filteredResponses.map(obj => {
      return {
        id: obj.value.data!.id,
        email: obj.value.data!.email
      }
    });

    return c.json({
      data,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.post('/signup', async (c) => {
  console.log('POST /signup');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const { email, password } = getTypedEmailPasswordFromBody(body);

  const id = body['id'] ? body['id'].toString() : uuidv4();

  try {
    const result = await signup({ id, email, password });

    if (result.error && result.error === 'User Already Exists') {
      return c.json({
        data: null,
        error: 'User Already Exists'
      });
    }

    return c.json({
      data: result.data,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.post('/login', async (c) => {
  console.log('POST /login');
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const { email, password } = getTypedEmailPasswordFromBody(body);

  try {
    const result = await login({ email, password });

    if (result.error && result.error === 'Wrong Password') {
      return c.json({
        data: null,
        error: 'Wrong Password'
      });
    }

    if (result.error && result.error === 'User Not Found') {
      return c.json({
        data: null,
        error: 'User Not Found'
      });
    }

    const session = createSession(result.data!);

    return c.json({
      data: session,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.post('/mock-oauth/:provider', async (c) => {
  const { provider } = c.req.param();

  console.log(`POST /mock-oauth/${provider}`);

  const hasOAuthVariables = (MOCK_OAUTH_EMAIL && MOCK_OAUTH_EMAIL !== '') && (MOCK_OAUTH_PASSWORD && MOCK_OAUTH_PASSWORD !== '');

  if (!hasOAuthVariables) {
    return c.json({
      data: null,
      error: 'No OAuth Found'
    })
  }

  const result = await login({ email: MOCK_OAUTH_EMAIL, password: MOCK_OAUTH_PASSWORD });

  if (result.error && result.error === 'Wrong Password') {
    return c.json({
      data: null,
      error: 'Wrong Password'
    });
  }

  if (result.error && result.error === 'User Not Found') {
    return c.json({
      data: null,
      error: 'User Not Found'
    });
  }

  const session = createSession(result.data!);

  return c.json({
    data: session,
    error: null
  });
});

app.post('/logout', async (c) => {
  console.log('POST /logout');
  try {
    const session = removeSession();

    return c.json({
      data: session,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.get('/get-current-session', async (c) => {
  try {
    const session = getCurrentSession();

    return c.json({
      data: session,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.delete('/delete-user/:userId', async (c) => {
  const { userId } = c.req.param();

  try {
    await deleteUser(userId);

    return c.json({
      data: null,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.delete('/delete-multiple-users', async (c) => {
  const contentType = c.req.header('Content-Type');

  // use c.req.json() if the content type is 'application/json' and c.req.parseBody() otherwise
  const body = contentType === 'application/json' ? await c.req.json() : await c.req.parseBody();

  const userIds = body;

  try {
    await deleteMultipleUsers(userIds);

    return c.json({
      data: null,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

app.delete('/clear', async (c) => {
  try {
    await deleteAllUsers();

    return c.json({
      data: null,
      error: null
    });
  } catch (error) {
    console.error(error);
    return c.json({
      data: null,
      error: 'Internal Server Error'
    });
  }
});

serve({
  fetch: app.fetch,
  port: Number(PORT),
}, (info) => {
  console.log(info);
  console.log('MOCKABASE SERVER RUNNING ON PORT', PORT);
});
