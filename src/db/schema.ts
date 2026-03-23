import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  encryptedPassword: text('encrypted_password'),
  phoneNumber: text('phone_number').unique(),
  oauthProvider: text('oauth_provider'),
  providerType: text('provider_type'),
  emailConfirmedAt: text('email_confirmed_at'),
  otp: text('otp'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});