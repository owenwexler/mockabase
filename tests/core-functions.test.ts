import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { seedDB, testDeleteUser } from './testFunctions/testFunctions';
import { seedData } from '../src/data/seedData';
import { testEnv } from './testEnv/testEnv';
import { newTestUser } from '../src/data/newTestUser';

import type { MockabaseUserReturnObject } from '../src/typedefs/MockabaseUserReturnObject';
import { createMockabaseClient } from '../src/mockabaseClient/mockabaseClient';
import { mockabaseErrors } from '../src/data/mockabaseErrors';

const { hostUrl } = testEnv;

const emptySessionObject: MockabaseUserReturnObject = { data: null, error: null };
const wrongPasswordErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.invalidCredentials };
const nonexistentUserErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.userNotFound };
const userAlreadyExistsErrorObject: MockabaseUserReturnObject = { data: null, error: mockabaseErrors.userAlreadyExists };

const mockabaseClient = createMockabaseClient({ mockabaseUrl: hostUrl });

const passwordUsers = seedData.filter(item => item.providerType === 'email-password');

const passwordLoginTestCases = passwordUsers.map(obj => {
  const { id, email, phoneNumber, providerType, oauthProvider } = obj;

  return {
    input: obj,
    expected: {
      data: { session: { id, email, phoneNumber, providerType, oauthProvider } },
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
    const correctNewTestUserResult = { session: { id: newTestUser.id, email: newTestUser.email, phoneNumber: null, providerType: 'email-password', oauthProvider: null } };

    const signupResult = await mockabaseClient.auth.signUpWithPassword(newTestUser);
    expect(signupResult).toEqual({
      data: correctNewTestUserResult,
      error: null
    });

    await mockabaseClient.auth.signOut();

    const result = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });

    expect(result).toEqual({
      data: correctNewTestUserResult,
      error: null
    });

    await mockabaseClient.auth.signOut();
  });

  test('a user can change their password successfully when logged in, the old password does not work after change and the new password works', async () => {
    const correctNewTestUserResult = { session: { id: newTestUser.id, email: newTestUser.email, phoneNumber: null, providerType: 'email-password', oauthProvider: null } };

    const login = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });

    const changePasswordResult = await changeTestUserPassword();

    await mockabaseClient.auth.signOut();

    const loginWithOldPassword = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: newTestUser.password });
    expect(loginWithOldPassword).toEqual({
      data: null,
      error: mockabaseErrors.invalidCredentials
    });

    const loginWithNewPassword = await mockabaseClient.auth.signInWithPassword({ email: newTestUser.email, password: 'testtesttest!2' });
    expect(loginWithNewPassword).toEqual({
      data: correctNewTestUserResult,
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

  // Phone login (gated by OTP verification)

  test('existing phone user: login returns invalidOTP when OTP is unverified, wrong OTP returns invalidOTP, new OTP can be assigned, verification succeeds and login succeeds, OTP is cleared and then a random OTP is reassigned after login blocking any subsequent login attempts, signing up an existing phone number returns userAlreadyExists', async () => {
    const existingPhoneUser = seedData.find(user => user.phoneNumber === '+13011234567')!;
    const existingPhoneSession = { data: { session: { id: existingPhoneUser.id, email: null, phoneNumber: '+13011234567', providerType: 'phone', oauthProvider: null } }, error: null };

    // login without verified OTP → invalidOTP
    const loginWithoutOtp = await mockabaseClient.auth.signInWithPhone({ phoneNumber: '+13011234567' });
    expect(loginWithoutOtp).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // verify with incorrect OTP → invalidOTP
    const wrongOtpResult = await mockabaseClient.auth.verifyOtp({ providerType: 'phone', phoneNumber: '+13011234567', otp: '654321' });
    expect(wrongOtpResult).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // assign new OTP "234567"
    const assignOtpResult = await mockabaseClient.auth.assignOtp({ providerType: 'phone', phoneNumber: '+13011234567', staticOTP: '234567' });
    expect(assignOtpResult.error).toBeNull();

    // verify with "234567" → success
    const verifyResult = await mockabaseClient.auth.verifyOtp({ providerType: 'phone', phoneNumber: '+13011234567', otp: '234567' });
    expect(verifyResult).toEqual({ data: 'ok', error: null });

    // login → success
    const loginResult = await mockabaseClient.auth.signInWithPhone({ phoneNumber: '+13011234567' });
    expect(loginResult).toEqual(existingPhoneSession);

    await mockabaseClient.auth.signOut();

    // with new OTP assigned, subsequent attempt to login returns invalidOTP
    const secondLoginResult = await mockabaseClient.auth.signInWithPhone({ phoneNumber: '+13011234567' });
    expect(secondLoginResult).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // signing up existing phone number → userAlreadyExists
    const signupExistingResult = await mockabaseClient.auth.signUpWithPhone({ phoneNumber: '+13011234567' });
    expect(signupExistingResult).toEqual({ data: null, error: mockabaseErrors.userAlreadyExists });
  });

  test('new phone user: signup succeeds, login returns missingOTP before OTP is verified, wrong OTP returns invalidOTP, deleting the user and attempting to log in returns userNotFound', async () => {
    const newPhoneUserId = 'f1a2b3c4-d5e6-7890-abcd-ef1234567890';
    const newPhoneNumber = '+6312345678910'; // this is a Philippine phone number, effectively also testing international phone number signup
    const newPhoneSession = { data: { session: { id: newPhoneUserId, email: null, phoneNumber: newPhoneNumber, providerType: 'phone', oauthProvider: null } }, error: null };

    // signup new phone user with static OTP
    const signupResult = await mockabaseClient.auth.signUpWithPhone({ id: newPhoneUserId, phoneNumber: newPhoneNumber, staticOTP: '123456' });
    expect(signupResult).toEqual(newPhoneSession);

    // login without verified OTP → missingOTP
    const loginWithoutOtp = await mockabaseClient.auth.signInWithPhone({ phoneNumber: newPhoneNumber });
    expect(loginWithoutOtp).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // verify with incorrect OTP → invalidOTP
    const wrongOtpResult = await mockabaseClient.auth.verifyOtp({ providerType: 'phone', phoneNumber: newPhoneNumber, otp: '654321' });
    expect(wrongOtpResult).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // delete the new phone user
    const deletionResult = await testDeleteUser(newPhoneUserId);
    expect(deletionResult).toEqual(emptySessionObject);

    // login after deletion → userNotFound
    const loginAfterDeletion = await mockabaseClient.auth.signInWithPhone({ phoneNumber: newPhoneNumber });
    expect(loginAfterDeletion).toEqual({ data: null, error: mockabaseErrors.userNotFound });
  });

  // Passwordless e-mail signup/login

  test('existing passwordless email user: attempted login with OTP assigned returns invalid OTP, wrong OTP returns invalidOTP, new OTP can be assigned, login succeeds and OTP is cleared and then a random OTP is reassigned blocking any subsequent login attempts without OTP, signing up an existing passwordless email returns userAlreadyExists', async () => {
    const existingPasswordlessUser = seedData.find(user => user.email === 'passwordlessemail@mockabase.com')!;
    const existingPasswordlessSession = { data: { session: { id: existingPasswordlessUser.id, email: 'passwordlessemail@mockabase.com', phoneNumber: null, providerType: 'email-passwordless', oauthProvider: null } }, error: null };

    // attempt login with an active unverified OTP still attached to the user → invalidOTP
    const loginWithoutOtp = await mockabaseClient.auth.signInWithEmailPasswordless({ email: 'passwordlessemail@mockabase.com' });
    expect(loginWithoutOtp).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // assign OTP "123456"
    const assignOtpResult123456 = await mockabaseClient.auth.assignOtp({ providerType: 'email-passwordless', email: 'passwordlessemail@mockabase.com', staticOTP: '123456' });
    expect(assignOtpResult123456).toEqual({ data: 'ok', error: null });

    // verify with incorrect OTP → invalidOTP
    const wrongOtpResult = await mockabaseClient.auth.verifyOtp({ providerType: 'email-passwordless', email: 'passwordlessemail@mockabase.com', otp: '654321' });
    expect(wrongOtpResult).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // assign new OTP "234567"
    const assignOtpResult = await mockabaseClient.auth.assignOtp({ providerType: 'email-passwordless', email: 'passwordlessemail@mockabase.com', staticOTP: '234567' });
    expect(assignOtpResult.error).toBeNull();

    const verifyOtpResult = await mockabaseClient.auth.verifyOtp({ providerType: 'email-passwordless', email: 'passwordlessemail@mockabase.com', otp: '234567' })
    expect(verifyOtpResult.error).toBeNull();

    // login → success (uses OTP "234567" and clears it)
    const loginResult = await mockabaseClient.auth.signInWithEmailPasswordless({ email: 'passwordlessemail@mockabase.com' });
    expect(loginResult).toEqual(existingPasswordlessSession);

    await mockabaseClient.auth.signOut();

    // re-assigned OTP — login again returns invalidOTP
    const loginAfterOtpCleared = await mockabaseClient.auth.signInWithEmailPasswordless({ email: 'passwordlessemail@mockabase.com' });
    expect(loginAfterOtpCleared).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    await mockabaseClient.auth.signOut();

    // signing up existing passwordless email → userAlreadyExists
    const signupExistingResult = await mockabaseClient.auth.signUpWithEmailPasswordless({ email: 'passwordlessemail@mockabase.com' });
    expect(signupExistingResult).toEqual({ data: null, error: mockabaseErrors.userAlreadyExists });
  });

  test('new passwordless email user: signup succeeds, wrong OTP returns invalidOTP, login succeeds and OTP is cleared, deleting the user and attempting to log in returns userNotFound', async () => {
    const newPasswordlessUserId = 'a1b2c3d4-e5f6-7890-abcd-fedcba098765';
    const newPasswordlessEmail = 'newpasswordless@test.com';
    const newPasswordlessSession = { data: { session: { id: newPasswordlessUserId, email: newPasswordlessEmail, phoneNumber: null, providerType: 'email-passwordless', oauthProvider: null } }, error: null };

    // signup new passwordless email user with static OTP
    const signupResult = await mockabaseClient.auth.signUpWithEmailPasswordless({ id: newPasswordlessUserId, email: newPasswordlessEmail, staticOTP: '123456' });
    expect(signupResult).toEqual(newPasswordlessSession);

    // verify with incorrect OTP → invalidOTP
    const wrongOtpResult = await mockabaseClient.auth.verifyOtp({ providerType: 'email-passwordless', email: newPasswordlessEmail, otp: '654321' });
    expect(wrongOtpResult).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    // verify with correct OTP → success
    const verifyResult = await mockabaseClient.auth.verifyOtp({ providerType: 'email-passwordless', email: newPasswordlessEmail, otp: '123456' });
    expect(verifyResult).toEqual({ data: 'ok', error: null });

    // login after OTP is verified → success
    const loginResult = await mockabaseClient.auth.signInWithEmailPasswordless({ email: newPasswordlessEmail });
    expect(loginResult).toEqual(newPasswordlessSession);

    await mockabaseClient.auth.signOut();

    // OTP is reassigned — login again returns invalidOTP
    const loginWithoutOtp = await mockabaseClient.auth.signInWithEmailPasswordless({ email: newPasswordlessEmail });
    expect(loginWithoutOtp).toEqual({ data: null, error: mockabaseErrors.invalidOTP });

    await mockabaseClient.auth.signOut();

    // delete the new passwordless email user
    const deletionResult = await testDeleteUser(newPasswordlessUserId);
    expect(deletionResult).toEqual(emptySessionObject);

    // login after deletion → userNotFound
    const loginAfterDeletion = await mockabaseClient.auth.signInWithEmailPasswordless({ email: newPasswordlessEmail });
    expect(loginAfterDeletion).toEqual({ data: null, error: mockabaseErrors.userNotFound });
  });

  // OAuth login
  test('existing OAuth user: wrong provider returns badOAuthCallback, correct provider logs in successfully, signing up with an already-used email returns userAlreadyExists', async () => {
    const existingOAuthUser = seedData.find(user => user.email === 'example@gmail.com')!;
    const existingOAuthSession = { data: { session: { id: existingOAuthUser.id, email: 'example@gmail.com', phoneNumber: null, providerType: 'oauth', oauthProvider: 'google' } }, error: null };

    // wrong provider → badOAuthCallback
    const wrongProviderResult = await mockabaseClient.auth.signInWithOAuth({ email: 'example@gmail.com', provider: 'discord' });
    expect(wrongProviderResult).toEqual({ data: null, error: mockabaseErrors.badOAuthCallback });

    // correct provider → success
    const loginResult = await mockabaseClient.auth.signInWithOAuth({ email: 'example@gmail.com', provider: 'google' });
    expect(loginResult).toEqual(existingOAuthSession);

    await mockabaseClient.auth.signOut();

    // signup with already-used email → userAlreadyExists
    const signupExistingResult = await mockabaseClient.auth.signUpWithOAuth({ email: 'example@gmail.com', provider: 'apple' });
    expect(signupExistingResult).toEqual({ data: null, error: mockabaseErrors.userAlreadyExists });
  });

  test('new OAuth user: signup succeeds, wrong provider returns badOAuthCallback, correct provider logs in successfully, deleting the user and attempting to log in returns userNotFound', async () => {
    const newOAuthEmail = 'example@apple.com';

    // signup new OAuth user with "apple" provider
    const signupResult = await mockabaseClient.auth.signUpWithOAuth({ email: newOAuthEmail, provider: 'apple' });
    expect(signupResult.error).toBeNull();
    expect(signupResult.data?.session.email).toBe(newOAuthEmail);
    expect(signupResult.data?.session.oauthProvider).toBe('apple');
    expect(signupResult.data?.session.providerType).toBe('oauth');

    const newOAuthUserId = signupResult.data!.session.id;

    // wrong provider → badOAuthCallback
    const wrongProviderResult = await mockabaseClient.auth.signInWithOAuth({ email: newOAuthEmail, provider: 'facebook' });
    expect(wrongProviderResult).toEqual({ data: null, error: mockabaseErrors.badOAuthCallback });

    // correct provider → success
    const loginResult = await mockabaseClient.auth.signInWithOAuth({ email: newOAuthEmail, provider: 'apple' });
    expect(loginResult).toEqual(signupResult);

    await mockabaseClient.auth.signOut();

    // delete the new OAuth user
    const deletionResult = await testDeleteUser(newOAuthUserId);
    expect(deletionResult).toEqual(emptySessionObject);

    // login after deletion → userNotFound
    const loginAfterDeletion = await mockabaseClient.auth.signInWithOAuth({ email: newOAuthEmail, provider: 'apple' });
    expect(loginAfterDeletion).toEqual({ data: null, error: mockabaseErrors.userNotFound });
  });

  // re-seed the test users into the DB after the tests are finished
  afterAll(async () => {
    await seedDB();
  })
});


