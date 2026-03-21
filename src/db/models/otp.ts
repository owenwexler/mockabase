import { failure, success, type DataErrorReturnObject } from "dataerror";
import type { AssignOTPArgs } from "../../typedefs/AssignOTPArgs";
import { generateRandomOTP } from "../../helper/generateRandomOTP";
import db from "../db";
import type { Statement } from "better-sqlite3";
import type Database from "better-sqlite3";
import type { VerifyOTPArgs } from "../../typedefs/VerifyOTPArgs";
import type { ShowOTPArgs } from "../../typedefs/ShowOTPArgs";
import type { ShowOTPResult } from "../../typedefs/ShowOTPResult";
import { mockabaseErrors } from "../../data/mockabaseErrors";
import type { User } from "../../typedefs/User";

const assignOtp = async (args: AssignOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber } = args;

  const otp = generateRandomOTP(6);

  try {
    if (providerType === 'phone') {
      const query = db.prepare('UPDATE users SET otp = ? WHERE phone_number = ?');
      const response = query.run(otp, phoneNumber);

      return await success<'ok'>('ok');
    } else {
      const query = db.prepare('UPDATE users SET otp = ? WHERE email = ?');
      const response = query.run(otp, email);

      return await success<'ok'>('ok');
    }
  } catch (error) {
    return await failure<'ok'>(error, 'models/assignOTP');
  }
}

const verifyOtp = async (args: VerifyOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber, otp } = args;

  let query: Statement<unknown[], unknown>;
  let response: Database.RunResult;

  try {
    if (providerType === 'phone') {
      // TODO: look into using a base query for the SELECTs so they aren't repeated 3 times
      query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE phone_number = ?');
      response = query.run(phoneNumber);
    } else {
      const query = db.prepare('SELECT id, email, phone_number AS "phoneNumber", provider_type AS "providerType", encrypted_password AS "encryptedPassword", otp FROM users WHERE email = ?');
      response = query.run(email);
    }

    const user: User | undefined = response as unknown as User | undefined; // Type assertion for safety

    if (user!.otp === otp) {
      return await success<'ok'>('ok');
    } else {
      return await failure<'ok'>(mockabaseErrors.invalidOTP, 'models/verifyOTP');
    }

  } catch (error) {
    return await failure<'ok'>(error, 'models/verifyOTP');
  }
}

const clearOtp = async (id: string): Promise<DataErrorReturnObject<null>> => {
  try {
    const query = db.prepare('UPDATE users SET otp = NULL WHERE id = ?')
    const response = query.run(id);

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/clearOTP');
  }
}

// part of a route that is used in development as a substitute for checking e-mail or text messages to get the OTP

const showOtp = async (args: ShowOTPArgs) => {
  const { userIdentifier, providerType } = args;

  try {
    if (providerType === 'phone') {
      const query = db.prepare('SELECT phone_number, otp FROM users WHERE phone_number = ?');
      const response = query.run(userIdentifier);

      const otpResult: ShowOTPResult | null = response && Array.isArray(response) ? response[0] : null;

      const otpNotFound = (!otpResult || !otpResult.otp || otpResult.otp === '');

      if (otpNotFound) {
        return await failure<ShowOTPResult>(mockabaseErrors.missingOTP, 'models/showOTP');
      }
      return await success<ShowOTPResult>(otpResult as ShowOTPResult);
    }
  } catch (error) {
    return await failure<ShowOTPResult>(error, 'models/showOTP');
  }
}

export {
  assignOtp,
  verifyOtp,
  clearOtp,
  showOtp
}