import { errors, type ErrorsObject, type ErrorType } from "dataerror";

export const mockabaseErrors: ErrorsObject = {
  ...errors,
  invalidOTP: {
    code: 'invalid_otp',
    message: 'Invalid or expired OTP',
    details: 'The given OTP is invalid or expired',
    hint: 'Request a new OTP'
  },
  missingOTP: {
    code: 'missing_otp',
    message: 'Missing OTP',
    details: 'There is no OTP assigned to the current user and one is needed',
    hint: 'Likely you tried to run a phone number or other passwordless sign-in without assigning and/or verifying an OTP first'
  }
};
