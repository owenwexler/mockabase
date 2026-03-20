import { errors, type ErrorsObject, type ErrorType } from "dataerror";

interface MockabaseErrorsObject extends ErrorsObject {
  invalidOTP: ErrorType;
  missingOTP: ErrorType;
  invalidPhoneNumber: ErrorType;
}

export const mockabaseErrors: MockabaseErrorsObject = {
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
  },
  invalidPhoneNumber: {
    code: 'invalid_phone_number',
    message: 'Invalid phone number',
    details: 'The phone number entered by the user is in an invalid format',
    hint: 'Check the format of the phone number entered'
  }
};
