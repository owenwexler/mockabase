import { errors } from "../data/errors";
import { typedFetch } from "../helper/typedFetch";
import type { OAuthProvider } from "../typedefs/OAuthProvider";
import type { ReturnObject } from "../typedefs/ReturnObject";

interface CreateMockbaseClientArgs {
  mockabaseUrl: string;
}

const createMockabaseClient = (args: CreateMockbaseClientArgs) => {
  const { mockabaseUrl } = args;
  return {
    url: mockabaseUrl,
    auth: {
      getUser: async function (): Promise<ReturnObject> {
        try {
          const response = await typedFetch<ReturnObject>({
            url: `${mockabaseUrl}/get-current-session`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          console.error(error);
          return { data: null, error: errors.internalServerError }
        }
      },
      getSession: async function (): Promise<ReturnObject> {
        const response = await typedFetch<ReturnObject>({
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
          const session = await typedFetch<ReturnObject>({
            url: `${mockabaseUrl}/email-password-login`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return session;
        } catch (error) {
          console.error(error);
          return { data: null, error: errors.internalServerError };
        }
      },
      signInWithOAuth: async function (args: { provider: OAuthProvider }) {
        const { provider } = args;

        try {
          const response = await typedFetch<ReturnObject>({
            url: `${mockabaseUrl}/mock-oauth/${provider}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          console.error(error);
          return { data: null, error: errors.internalServerError };
        }
      },
      signOut: async function () {
        const response = await typedFetch<ReturnObject>({
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
          const response = await typedFetch<ReturnObject>({
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
          console.error(error);
          return { data: null, error: errors.internalServerError };
        }
      },
      signUpWithOAuth: async function(args: { provider: OAuthProvider }) {
        const { provider } = args;

        try {
          const response = await typedFetch<ReturnObject>({
            url: `${mockabaseUrl}/mock-oauth/${provider}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return response;
        } catch (error) {
          console.error(error);
          return { data: null, error: errors.internalServerError };
        }
      },
      updateUser: async function (args: { email: string, newPassword: string }) {
        const { email, newPassword } = args;

        try {
          const response = await typedFetch<ReturnObject>({
            url: `${mockabaseUrl}/change-password`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
          });

          return response;
        } catch (error) {
          console.error(error);
          return { data: null, error: errors.internalServerError };
        }
      }
    }
  }
}

export {
  createMockabaseClient
}
