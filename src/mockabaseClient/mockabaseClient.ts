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
    getUser: async function (): Promise<ReturnObject> {
      const response = await typedFetch<ReturnObject>({
        url: `${mockabaseUrl}/get-current-session`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response;
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
          url: `${mockabaseUrl}/login`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(args)
        });

        return session;
      } catch (error) {
        console.error(error);
        throw error;
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
        throw error;
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
          url: `${mockabaseUrl}/signup`,
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
        throw error;
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
        throw error;
      }
    }
  }
}

export {
  createMockabaseClient
}
