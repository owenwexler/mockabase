import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

import { emailPasswordRoutes } from './routes/emailPasswordRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { otpRoutes } from './routes/otpRoutes';
import { phoneRoutes } from './routes/phoneRoutes';
import { sessionRoutes } from './routes/sessionRoutes';
import { emailPasswordlessRoutes } from './routes/emailPasswordlessRoutes';
import { oauthRoutes } from './routes/oauthRoutes';

const { PORT } = process.env;

const app = new Hono();

app.route('/email-password', emailPasswordRoutes);
app.route('/email-passwordless', emailPasswordlessRoutes);
app.route('/admin', adminRoutes);
app.route('/otp', otpRoutes);
app.route('/phone', phoneRoutes);
app.route('/session', sessionRoutes);
app.route('/oauth', oauthRoutes);

app.get('/', (c) => {
  console.log('GET /');
  return c.text('Pick a route');
});

serve({
  fetch: app.fetch,
  port: Number(PORT),
}, (info) => {
  console.log(info);
  console.log('MOCKABASE SERVER RUNNING ON PORT', PORT);
});
