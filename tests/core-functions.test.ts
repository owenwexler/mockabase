import { test, describe, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { seedDB, testGetSession, testLogin, testLogout } from './testFunctions/testFunctions';
import { seedData } from '../src/data/seedData';

const emptySessionObject = { data: null, error: null }

const loginTestCases = seedData.map(obj => {
  return {
    input: obj,
    expected: {
      data: { id: obj.id, email: obj.email },
      error: null
    }
  }
})

describe('Core functions', () => {
  beforeAll(async () => {
    await seedDB();
  });

  test.each(loginTestCases)(`logging in as each test user with the correct password returns the expected result`, async ({ input, expected }) => {
    const session = await testLogin({ email: input.email, password: input.password });
    expect(session).toEqual(expected);
    await testLogout();
  })

  test('when logged out, getting the current session returns a null object', async () => {
    await testLogout();
    const session = await testGetSession();
    console.log('session:', session);
    expect(session).toEqual({ data: null, error: null });
  });

  afterAll(async () => {
    await seedDB();
  })
});
