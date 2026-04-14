import { typedFetch } from "../helper/typedFetch";
import type { OAuthProvider } from "../typedefs/OAuthProvider";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import { failure } from "dataerror";
import type { DataErrorReturnObject } from "dataerror";
import type { AssignOTPArgs } from "../typedefs/AssignOTPArgs";
import type { VerifyOTPArgs } from "../typedefs/VerifyOTPArgs";
import type { PhoneSignupArgs } from "../typedefs/PhoneSignupArgs";
import type { GenericUserPhoneArgs } from "../typedefs/GenericUserPhoneArgs";
import type { EmailPasswordlessSignupArgs } from "../typedefs/EmailPasswordlessSignupArgs";
import type { ShowOTPArgs } from "../typedefs/ShowOTPArgs";
import type { UserSessionObject } from "../typedefs/UserSessionObject";

interface GetIdByEmailReturnType {
  id: string;
}

interface PasswordSignInArgs {
  id: string;
  email: string;
  password: string;
}

interface OAuthSignInArgs {
  email: string;
  provider: OAuthProvider;
}

interface MockabaseClientAuthObject {
  getUser: () => Promise<MockabaseUserReturnObject>;
  getSession: () => Promise<MockabaseUserReturnObject>;
  signInWithPassword: (args: PasswordSignInArgs) => Promise<MockabaseUserReturnObject>;
  signUpWithPassword: (args: PasswordSignInArgs) => Promise<MockabaseUserReturnObject>;
  updateUser: (args: { email: string, newPassword: string }) => Promise<MockabaseUserReturnObject>;
  signUpWithOAuth: (args: OAuthSignInArgs) => Promise<MockabaseUserReturnObject>;
  signInWithOAuth: (args: OAuthSignInArgs) => Promise<MockabaseUserReturnObject>;
  signUpWithPhone: (args: PhoneSignupArgs) => Promise<MockabaseUserReturnObject>;
  signInWithPhone: (args: GenericUserPhoneArgs) => Promise<MockabaseUserReturnObject>;
  signUpWithEmailPasswordless: (args: EmailPasswordlessSignupArgs) => Promise<MockabaseUserReturnObject>;
  signInWithEmailPasswordless: (args: EmailPasswordlessSignupArgs) => Promise<MockabaseUserReturnObject>;
  assignOtp: (args: AssignOTPArgs) => Promise<MockabaseUserReturnObject>;
  verifyOtp: (args: VerifyOTPArgs) => Promise<MockabaseUserReturnObject>;
  clearOtp: (id: string) => Promise<MockabaseUserReturnObject>;
  showOtp: (args: ShowOTPArgs) => Promise<MockabaseUserReturnObject>;
  signOut: () => Promise<void>;
  deleteUser: (userId: string) => Promise<MockabaseUserReturnObject>;
  getIdByEmail: (email: string) => Promise<DataErrorReturnObject<GetIdByEmailReturnType>>;
}

interface MockabaseClient {
  url: string;
  auth: MockabaseClientAuthObject;
}

interface CreateMockbaseClientArgs {
  mockabaseUrl: string;
}

const createMockabaseClient = (args: CreateMockbaseClientArgs): MockabaseClient => {
  const { mockabaseUrl } = args;
  return {
    url: mockabaseUrl,
    auth: {
      getUser: async function (): Promise<MockabaseUserReturnObject> {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/session/get-current-session`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/getUser');
        }
      },
      getSession: async function (): Promise<MockabaseUserReturnObject> {
        const response = await typedFetch<MockabaseUserReturnObject>({
          url: `${mockabaseUrl}/session/get-current-session`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        return response;
      },
      signInWithPassword: async function (args: { id: string, email: string, password: string }) {
        try {
          const session = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-password/login`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return session;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/signInWithPassword');
        }
      },
      signUpWithPassword: async function (args: { id: string, email: string, password: string }) {
        const { id, email, password } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-password/signup`,
            body: JSON.stringify({
              id,
              email,
              password
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/signUpWithPassword');
        }
      },
      updateUser: async function (args: { email: string, newPassword: string }) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-password/change-password`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/updateUser');
        }
      },
      signUpWithOAuth: async function(args: { email: string, provider: OAuthProvider }) {
        const { email, provider } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/oauth/signup/${provider}`,
            body: JSON.stringify({ email }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/signUpWithOAuth');
        }
      },
      signInWithOAuth: async function (args: { email: string, provider: OAuthProvider }) {
        const { email, provider } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/oauth/login/${provider}`,
            method: 'POST',
            body: JSON.stringify({ email }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/signInWithOAuth');
        }
      },
      signUpWithPhone: async function (args: PhoneSignupArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/phone/signup`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signUpWithPhone');
        }
      },
      signInWithPhone: async function (args: GenericUserPhoneArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/phone/login`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signInWithPhone');
        }
      },
      signUpWithEmailPasswordless: async function (args: EmailPasswordlessSignupArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-passwordless/signup`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signUpWithEmailPasswordless');
        }
      },
      signInWithEmailPasswordless: async function (args: EmailPasswordlessSignupArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-passwordless/login`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/signInWithEmailPasswordless');
        }
      },
      // Supabase uses Otp in their function names instead of OTP so this is what we are doing
      assignOtp: async function (args: AssignOTPArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/otp/assign-otp`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/assignOtp');
        }
      },
      verifyOtp: async function (args: VerifyOTPArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/otp/verify-otp`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/verifyOtp');
        }
      },
      clearOtp: async function (id: string) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/otp/clear-otp`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/clearOtp');
        }
      },
      showOtp: async function (args: ShowOTPArgs) {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/otp/show-otp`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          return await failure<UserSessionObject>(error, 'mockabaseClient/showOtp');
        }
      },
      signOut: async function () {
        const response = await typedFetch<MockabaseUserReturnObject>({
          url: `${mockabaseUrl}/session/logout`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      },
      deleteUser: async function (userId: string) {
        const response = await typedFetch<MockabaseUserReturnObject>({
          url: `${mockabaseUrl}/admin/delete-user/${userId}`,
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        return response;
      },
      getIdByEmail: async function (email: string) {
        try {
          const response = await typedFetch<DataErrorReturnObject<GetIdByEmailReturnType>>({
            url: `${mockabaseUrl}/admin/get-id-by-email?email=${encodeURIComponent(email)}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          return response;
        } catch (error) {
          return await failure<{ id: string }>(error, 'mockabaseClient/getIdByEmail');
        }
      }
    }
  }
}

export {
  createMockabaseClient
}
