import { seedData } from "../../src/data/seedData";
import { typedFetch } from "../../src/helper/typedFetch";
import type { ReturnObject } from "../../src/typedefs/ReturnObject";

import { testEnv } from "../testEnv/testEnv";

const { hostUrl } = testEnv;

// setup function that clears the DB and then seeds it with the included seed data - this setup effectively also tests the /clear and /seed routes, so no separate tests are needed for these
const seedDB = async () => {
  try {
    const clearResult = await typedFetch({
      url: `${hostUrl}/clear`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const seedResult = await typedFetch<ReturnObject[]>({
      url: `${hostUrl}/seed`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(seedData)
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const testLogin = async (args: { email: string, password: string }) => {
  try {
    const session = await typedFetch<ReturnObject>({
      url: `${hostUrl}/login`,
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
}

const testGetSession = async () => {
  const response = await typedFetch<ReturnObject>({
    url: `${hostUrl}/get-current-session`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

const testSignUp = async (args: { id: string, email: string, password: string }) => {
const { id, email, password } = args;

  try {
    const response = await typedFetch<ReturnObject>({
      url: `${hostUrl}/signup`,
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
}

const testDeleteUser = async (userId: string) => {
  try {
    const response = await typedFetch<ReturnObject>({
      url: `${hostUrl}/delete-user/${userId}`,
      method: 'DELETE',
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

export {
  seedDB,
  testLogin,
  testGetSession,
  testSignUp,
  testDeleteUser
}
