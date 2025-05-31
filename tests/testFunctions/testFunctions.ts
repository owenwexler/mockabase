import { seedData } from "../../src/data/seedData";
import { typedFetch } from "../../src/helper/typedFetch";
import type { ReturnObject } from "../../src/typedefs/ReturnObject";

import { testEnv } from "../testEnv/testEnv";

const { hostUrl } = testEnv;

const seedIds = seedData.map(obj => obj.id);

// setup function that clears the DB and then seeds it with the included seed data - this setup effectively also tests the /delete-multiple-users and /seed routes, so no separate tests are needed for these
// the /delete-multiple-users route is used instead of the clear route so that only the seed data for testing is cleared and not any other created users
const seedDB = async () => {
  try {
    const clearResult = await typedFetch({
      url: `${hostUrl}/delete-multiple-users`,
      body: JSON.stringify(seedIds),
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
  testDeleteUser,
}
