import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { seedDB, testDeleteUser } from './testFunctions/testFunctions';
import { seedData } from '../src/data/seedData';
import { testEnv } from './testEnv/testEnv';
import { newTestUser } from '../src/data/newTestUser';

import type { MockabaseUserReturnObject } from '../src/typedefs/MockabaseUserReturnObject';
import { createMockabaseClient } from '../src/mockabaseClient/mockabaseClient';
import { mockabaseErrors } from '../src/data/mockabaseErrors';

const { mockOAuthEmail, hostUrl } = testEnv;

const emptySessionObject: MockabaseUserReturnObject = { data: null, error: null };
const wrongPasswordErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.invalidCredentials };
const nonexistentUserErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.userNotFound };
const userAlreadyExistsErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.userAlreadyExists };

const mockabaseClient = createMockabaseClient({ mockabaseUrl: hostUrl });

const passwordLoginTestCases = seedData.slice(0, 2).map(obj => {
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
    input: { email: 'owenwexler@mockabase.com', password: 'owexler!2' },
    expected: wrongPasswordErrorObject
  },
  {
    input: { email: 'owenwexler@mockabase.com', password: 'asdfsdfwoeifjoi' },
    expected: wrongPasswordErrorObject
  }
];

const changeTestUserPassword = async () => {
  try {
    const changePasswordWithoutLoginResult = await mockabaseClient.auth.updateUser({ email: newTestUser.email, newPassword: 'testtesttest!2' });
    return changePasswordWithoutLoginResult;
  } catch (error) {
    console.error(error);
	  return {
			data: null,
			error: mockabaseErrors.internalServerError
		}
  }
}

describe('Core functions', () => {
  // clear the test users out of the DB if they exist and re-seed them before running the test suite
  beforeAll(async () => {
    await seedDB();
  });

  test.each(passwordLoginTestCases)(`logging in as each test user with the correct password returns the expected result`, async ({ input, expected }) => {
    const result = await mockabaseClient.auth.signInWithPassword({ email: input.email!, password: input.password! });
    expect(result).toEqual(expected);
    await mockabaseClient.auth.signOut();
  })

  test('when logged out, getting the current session returns a null object', async () => {
    await mockabaseClient.auth.signOut();
    const session = await mockabaseClient.auth.getSession();
    expect(session).toEqual({ data: null, error: null });
  });

  test.each(wrongPasswordTestCases)('attempting to login as one of the seeded users with both a blatantly wrong password and a password with one character off returns the proper error', async ({ input, expected }) => {
    const result = await mockabaseClient.auth.signInWithPassword(input);
    expect(result).toEqual(expected);
    await mockabaseClient.auth.signOut();
  });

  test('attempting to log in as a nonexistent user returns the proper error', async () => {
    const session = await mockabaseClient.auth.signInWithPassword({ email: 'thisuser@doesntexist.com', password: 'doesntexist' });
    expect(session).toEqual(nonexistentUserErrorObject);
    await mockabaseClient.auth.signOut();
  });

  test('attempting to sign up with the email of an already existing user returns the proper error', async () => {
    const response = await mockabaseClient.auth.signUpWithPassword({ id: 'd6829dc1-4bd5-425e-9b7f-14f3a721aaa8', email: seedData[0].email!, password: 'doesntexist' });
    expect(response).toEqual(userAlreadyExistsErrorObject);
  });

  test('a new test user can be signed up successfully and a logged-in session by email returns the new user', async () => {
    const signupResult = await mockabaseClient.auth.signUpWithPassword(newTestUser);
    expect(signupResult).toEqual({
      data: { user: { id: newTestUser.id, email: newTestUser.email } },
      error: null
    });

    await mockabaseClient.auth.signOut();

    const result = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });

    expect(result).toEqual({
      data: { user: { id: newTestUser.id, email: newTestUser.email } },
      error: null
    });

    await mockabaseClient.auth.signOut();
  });

  test('a user can change their password successfully when logged in, the old password does not work after change and the new password works', async () => {
    const login = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });

    const changePasswordResult = await changeTestUserPassword();

    await mockabaseClient.auth.signOut();

    const loginWithOldPassword = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });
    expect(loginWithOldPassword).toEqual({
      data: null,
      error: mockabaseErrors.invalidCredentials
    });

    const loginWithNewPassword = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: 'testtesttest' });
    expect(loginWithNewPassword).toEqual({
      data: { user: { id: newTestUser.id, email: newTestUser.email } },
      error: null
    });

    await mockabaseClient.auth.signOut();
  });

  test('the test user can be deleted successfully, and attempting to log in with the deleted test user returns the proper error', async () => {
    const deletionResult = await testDeleteUser(newTestUser.id);
    expect(deletionResult).toEqual(emptySessionObject);

    const deletedUserSession = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });
    expect(deletedUserSession).toEqual(nonexistentUserErrorObject);
  });

  /*
  NEW TESTS (put all of these new tests before the afterAll hook):
  - Phone login (always to be gated by an OTP verification):
  * when using assignOtp or any signup function, use the optional { staticOTP } argument to assign a static non-random OTP to the new user for testability
    - trying to log in an existing phone user (use "+13011234567", which is seeded into the DB at the beginning of the test run with the OTP "123456") without a verified OTP first returns the correct error (mockabaseErrors.missingOTP)
    - trying to verify OTP on an an existing phone user with an incorrect OTP ("654321") returns the correct error (mockabaseErrors.invalidOTP)
    - a new OTP (staticOTP: "234567") can be assigned to an existing phone number
    - verification with the new OTP ("234567") on the new phone number is successful and the phone number user can be logged in successfully
    - once logged in, the OTP is cleared from the user (check this with showOtp function in Mockabase client)
    - log out existing user
    - attempting to sign up an already existing phone number user returns the proper error (mockabaseErrors.userAlreadyExists)
    - a new phone number user ("+6312345678910") can be signed up with a static OTP ("123456")
    - trying to log in the new user without an OTP returns the correct error (mockabaseErrors.missingOTP)
    - trying to verify OTP on the new user with an incorrect OTP returns the proper error (mockabaseErrors.invalidOTP)

  - Passwordless e-mail signup/login:
    - please write a similar suite of tests as the above phone login/signup tests but for passwordless e-mail signups, which work in an almost identical manner in Mockabase

  - OAuth login
    - Trying to login an existing OAuth user (example@gmail.com) with the wrong provider ("discord") returns the correct error (mockabaseErrors.badOAuthCallback)
    - Logging in an existing OAuth user with the proper provider ("google") is successful, log out the OAuth user after verifying a successful session
    - attempting to sign up a new OAuth user with an already-used e-mail address returns the proper error (mockabaseErrors.userAlreadyExists)
    - A new OAuth user ("example@apple.com") can be signed up with the "apple" oauth provider
    - Logging in the new OAuth user with the wrong provider ("facebook") returns the correct error message (mockabaseErrors.badOAuthCallback)
    - Logging in the new OAuth user with the proper provider is successful, log out the OAuth user after verifying a successful session
  */

  // re-seed the test users into the DB after the tests are finished
  afterAll(async () => {
    await seedDB();
  })
});


