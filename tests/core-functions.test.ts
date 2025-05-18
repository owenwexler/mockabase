import { test, describe, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { seedDB } from './testFunctions/testFunctions';

describe('Core functions', () => {
  beforeAll(async () => {
    await seedDB();
  });

  test('can log in and log out of each account in the seed data with the correct password, and getting a session after logging into each account returns the proper result', () => {

  });

  test('when logged out, getting the current session returns a null object', () => {

  });

  afterAll(async () => {
    await seedDB();
  })
});
