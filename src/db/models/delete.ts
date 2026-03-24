import db from '../db';
import { users } from '../schema.js';
import { eq, inArray } from 'drizzle-orm';
import { failure, success, type DataErrorReturnObject } from 'dataerror';
import { mockabaseErrors } from '../../data/mockabaseErrors';

const deleteUser = async (id: string): Promise<DataErrorReturnObject<null>> => {
  try {
    db.delete(users).where(eq(users.id, id)).run();

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/deleteUser');
  }
}

type DeletedCount = { deleted: number };

const deleteMultipleUsers = async (ids: string[]): Promise<DataErrorReturnObject<DeletedCount>> => {
// Preserve original input checks/early returns
  if (!Array.isArray(ids) || ids.length === 0) {
    return await failure<DeletedCount>(mockabaseErrors.missingInputs, 'models/deleteMultipleUsers');
  }

  // Conservative batch size to stay under SQLite's variable limit.
  // If you know your build sets a different SQLITE_MAX_VARIABLE_NUMBER,
  // adjust this accordingly.
  const BATCH_SIZE = 500;

  // Helper to chunk the input
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    chunks.push(ids.slice(i, i + BATCH_SIZE));
  }

  try {
    let totalDeleted = 0;

    // Wrap all batched statements in a single transaction
    db.transaction((tx) => {
      for (const chunk of chunks) {
        const deleted = tx.delete(users).where(inArray(users.id, chunk)).returning({ id: users.id }).all();
        totalDeleted += deleted.length;
      }
    });

    return await success<DeletedCount>({ deleted: totalDeleted });
  } catch (error) {
    return await failure<DeletedCount>(error, 'models/deleteMultipleUsers');
  }
}

const deleteAllUsers = async (): Promise<DataErrorReturnObject<null>> => {
  try {
    db.delete(users).run();

    return await success<null>(null);
  } catch (error) {
    return await failure<null>(error, 'models/deleteAllUsers');
  }
}

export {
  deleteUser,
  deleteMultipleUsers,
  deleteAllUsers,
}
