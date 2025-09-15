import type { ErrorType } from "../typedefs/ErrorType";

interface ErrorsObject {
  internalServerError: ErrorType;
  invalidCredentials: ErrorType;
  badOAuthCallback: ErrorType;
  userNotFound: ErrorType;
  userAlreadyExists: ErrorType;
  missingPassword: ErrorType;
  weakPassword: ErrorType;
  sessionNotFound: ErrorType;
  [key: string]: ErrorType
}

export const errors: ErrorsObject = {
  internalServerError: {
    code: 'internal_server_error',
    message: 'Internal Server Error',
    details: 'We are sorry, something went wrong',
    hint: 'Try again later'
  },
  invalidCredentials: {
    code: 'invalid_credentials',
    message: 'Invalid login credentials',
    details: 'The email or password is incorrect',
    hint: 'Double-check your email and password and try again'
  },
  badOAuthCallback: {
    code: 'bad_oauth_callback',
    message: 'Bad OAuth Callback',
    details: 'The email or password is incorrect',
    hint: 'Double-check your email and password and try again'
  },
  userNotFound: {
    code: 'user_not_found',
    message: 'User not found',
    details: 'No user exists with the provided credentials',
    hint: 'Check that the user has signed up'
  },
  userAlreadyExists: {
    code: 'user_already_exists',
    message: 'User already registered',
    details: 'A user already exists with this email address',
    hint: 'Use sign-in instead of sign-up'
  },
  missingPassword: {
    code: 'missing_password',
    message: 'Password required',
    details: 'A password is required to sign up',
    hint: 'Ensure a valid password is provided'
  },
  weakPassword: {
    code: 'weak_password',
    message: 'Weak Password',
    details: 'The password is too weak',
    hint: 'Try a stronger password'
  },
  sessionNotFound: {
    code: 'session_not_found',
    message: 'Session Not Found',
    details: 'Session to which the API request relates has expired.',
    hint: 'Try logging back in'
  },
  missingInputs: {
    code: 'missing_inputs',
    message: 'Missing Inputs',
    details: 'Required inputs are missing',
    hint: 'Check that all require inputs are passed in to the function'
  }
};
