import { failure, success, type DataErrorReturnObject } from "dataerror";
import type { AssignOTPArgs } from "../../typedefs/AssignOTPArgs";
import { generateRandomOTP } from "../../helper/generateRandomOTP";
import db from "../db";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
import type { VerifyOTPArgs } from "../../typedefs/VerifyOTPArgs";
import type { ShowOTPArgs } from "../../typedefs/ShowOTPArgs";
import type { ShowOTPResult } from "../../typedefs/ShowOTPResult";
import { mockabaseErrors } from "../../data/mockabaseErrors";
import type { User } from "../../typedefs/User";

const assignOtp = async (args: AssignOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber } = args;

  const otp = args.staticOTP ? args.staticOTP : generateRandomOTP(6);

  try {
    if (providerType === 'phone') {
      const response = db.update(users).set({ otp }).where(eq(users.phoneNumber, phoneNumber!)).run();

      return await success<'ok'>('ok');
    } else {
      db.update(users).set({ otp }).where(eq(users.email, email!)).run();

      return await success<'ok'>('ok');
    }
  } catch (error) {
    return await failure<'ok'>(error, 'models/assignOTP');
  }
}

const verifyOtp = async (args: VerifyOTPArgs): Promise<DataErrorReturnObject<'ok'>> => {
  const { providerType, email, phoneNumber, otp } = args;

  try {
    let rows: { id: string; email: string | null; phoneNumber: string | null; providerType: string | null; encryptedPassword: string | null; otp: string | null; }[];

    if (providerType === 'phone') {
      // TODO: look into using a base query for the SELECTs so they aren't repeated 3 times
      rows = db.select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        providerType: users.providerType,
        encryptedPassword: users.encryptedPassword,
        otp: users.otp,
      }).from(users).where(eq(users.phoneNumber, phoneNumber!)).all();
    } else {
      rows = db.select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        providerType: users.providerType,
        encryptedPassword: users.encryptedPassword,
        otp: users.otp,
      }).from(users).where(eq(users.email, email!)).all();
    }

    const user: User | undefined = rows[0] as User | undefined;

    if (!user) {
      return await failure<'ok'>(mockabaseErrors.userNotFound, 'models/verifyOtp');
    }

    if (user!.otp === otp) {
      // clear the OTP once verified
      await clearOtp(user!.id);

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
    db.update(users).set({ otp: null }).where(eq(users.id, id)).run();

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
      const rows = db.select({ email: users.email, phoneNumber: users.phoneNumber, otp: users.otp }).from(users).where(eq(users.phoneNumber, userIdentifier)).all();
      const response = rows[0] ?? null;

      const otpResult: ShowOTPResult | null = response;

      const otpNotFound = (!otpResult || !otpResult.otp || otpResult.otp === '');

      if (otpNotFound) {
        return await failure<ShowOTPResult>(mockabaseErrors.missingOTP, 'models/showOTP');
      }
      return await success<ShowOTPResult>(otpResult as ShowOTPResult);
    } else {
      const rows = db.select({ email: users.email, phoneNumber: users.phoneNumber, otp: users.otp }).from(users).where(eq(users.email, userIdentifier)).all();
      const response = rows[0] ?? null;

      const otpResult: ShowOTPResult | null = response;

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
