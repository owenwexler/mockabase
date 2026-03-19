import { typedFetch } from "../helper/typedFetch";
import type { OAuthProvider } from "../typedefs/OAuthProvider";
import type { MockabaseUserReturnObject } from "../typedefs/MockabaseUserReturnObject";
import { failure } from "dataerror";
import type { AssignOTPArgs } from "../typedefs/AssignOTPArgs";

interface CreateMockbaseClientArgs {
  mockabaseUrl: string;
}

const createMockabaseClient = (args: CreateMockbaseClientArgs) => {
  const { mockabaseUrl } = args;
  return {
    url: mockabaseUrl,
    auth: {
      getUser: async function (): Promise<MockabaseUserReturnObject> {
        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/get-current-session`,
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
          url: `${mockabaseUrl}/get-current-session`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        return response;
      },
      signInWithPassword: async function (args: { email: string, password: string }) {
        try {
          const session = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-password-login`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return session;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signInWithPassword');
        }
      },
      signInWithOAuth: async function (args: { provider: OAuthProvider }) {
        const { provider } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/mock-oauth/${provider}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signInWithOAuth');
        }
      },
      signOut: async function () {
        const response = await typedFetch<MockabaseUserReturnObject>({
          url: `${mockabaseUrl}/logout`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      },
      signUpWithPassword: async function (args: { id: string, email: string, password: string }) {
        const { id, email, password } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/email-password-signup`,
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
          return await failure<null>(error, 'mockabaseClient/signUpWithPassword');
        }
      },
      signUpWithOAuth: async function(args: { provider: OAuthProvider }) {
        const { provider } = args;

        try {
          const response = await typedFetch<MockabaseUserReturnObject>({
            url: `${mockabaseUrl}/mock-oauth/${provider}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          return await failure<null>(error, 'mockabaseClient/signUpWithOAuth');
        }
      },
      updateUser: async function (args: { email: string, newPassword: string }) {
        try {
        const response = await typedFetch<MockabaseUserReturnObject>({
          url: `${mockabaseUrl}/change-password`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(args)
        });

        return response;
      } catch (error) {
        return await failure<null>(error, 'mockabaseClient/updateUser');
      }
    },
    assignOTP: async function (args: AssignOTPArgs) {
      // TODO: write this
    },
    verifyOTP: async function (args: VerifyOTPArgs) {
      // TODO: write this
    }
  }
}

export {
  createMockabaseClient
}
