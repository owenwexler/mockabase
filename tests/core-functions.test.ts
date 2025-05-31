import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { seedDB, testDeleteUser } from './testFunctions/testFunctions';
import { seedData } from '../src/data/seedData';
import { testEnv } from './testEnv/testEnv';
import { newTestUser } from '../src/data/newTestUser';

import type { ReturnObject } from '../src/typedefs/ReturnObject';
import { errors } from '../src/data/errors';
import { createMockabaseClient } from '../src/mockabaseClient/mockabaseClient';

const { mockOAuthEmail, hostUrl } = testEnv;

const emptySessionObject: ReturnObject = { data: null, error: null };
const wrongPasswordErrorObject: ReturnObject = { data: null, error: errors.invalidCredentials };
const nonexistentUserErrorObject: ReturnObject = { data: null, error: errors.userNotFound };
const userAlreadyExistsErrorObject: ReturnObject = { data: null, error: errors.userAlreadyExists };

const mockabaseClient = createMockabaseClient({ mockabaseUrl: hostUrl });

const loginTestCases = seedData.map(obj => {
  return {
    input: obj,
    expected: {
      data: { user: { id: obj.id, email: obj.email } },
      error: null
    }
  }
});

const wrongPasswordTestCases = [
  {
    input: { email: 'owenwexler@mockabase.com', password: 'owexler2' },
    expected: wrongPasswordErrorObject
  },
  {
    input: { email: 'owenwexler@mockabase.com', password: 'asdfsdfwoeifjoi' },
    expected: wrongPasswordErrorObject
  }
];

describe('Core functions', () => {
  // clear the test users out of the DB if they exist and re-seed them before running the test suite
  beforeAll(async () => {
    await seedDB();
  });

  test.each(loginTestCases)(`logging in as each test user with the correct password returns the expected result`, async ({ input, expected }) => {
    const result = await mockabaseClient.signInWithPassword({ email: input.email, password: input.password });
    expect(result).toEqual(expected);
    await mockabaseClient.signOut();
  })

  test('when logged out, getting the current session returns a null object', async () => {
    await mockabaseClient.signOut();
    const session = await mockabaseClient.getSession();
    expect(session).toEqual({ data: null, error: null });
  });

  test.each(wrongPasswordTestCases)('attempting to login as one of the seeded users with both a blatantly wrong password and a password with one character off returns the proper error', async ({ input, expected }) => {
    const result = await mockabaseClient.signInWithPassword(input);
    expect(result).toEqual(expected);
    await mockabaseClient.signOut();
  });

  test('attempting to log in as a nonexistent user returns the proper error', async () => {
    const session = await mockabaseClient.signInWithPassword({ email: 'thisuser@doesntexist.com', password: 'doesntexist' });
    expect(session).toEqual(nonexistentUserErrorObject);
    await mockabaseClient.signOut();
  });

  test('attempting to sign up with the email of an already existing user returns the proper error', async () => {
    const response = await mockabaseClient.signUpWithPassword({ id: 'd6829dc1-4bd5-425e-9b7f-14f3a721aaa8', email: seedData[0].email, password: 'doesntexist' });
    expect(response).toEqual(userAlreadyExistsErrorObject);
  });

  test('mock OAuth login returns the proper response', async () => {
    const session = await mockabaseClient.signInWithOAuth({ provider: 'google' });
    expect(session.data!.user.email).toEqual(mockOAuthEmail);
    await mockabaseClient.signOut();
  });

  test('a new test user can be signed up successfully, a logged-in session returns the new user, the test user can be deleted successfully, and attempting to login with the deletd test user returns the proper error', async () => {
    const signupResult = await mockabaseClient.signUpWithPassword(newTestUser);
    expect(signupResult).toEqual({
      data: { user: { id: newTestUser.id, email: newTestUser.email } },
      error: null
    });

    await mockabaseClient.signOut();

    const result = await mockabaseClient.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });

    expect(result).toEqual({
      data: { user: { id: newTestUser.id, email: newTestUser.email } },
      error: null
    });

    await mockabaseClient.signOut();

    const deletionResult = await testDeleteUser(newTestUser.id);
    expect(deletionResult).toEqual(emptySessionObject);

    const deletedUserSession = await mockabaseClient.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });
    expect(deletedUserSession).toEqual(nonexistentUserErrorObject);
  });

  // re-seed the test users into the DB after the tests are finished
  afterAll(async () => {
    await seedDB();
  })
});
