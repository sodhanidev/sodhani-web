import { MongoClient, type CreateIndexesOptions, type Db, type IndexSpecification } from "mongodb";

import { getAuthConfig } from "./config";

type MongoGlobal = typeof globalThis & {
  __sodhaniAuthIndexesPromise?: Promise<void>;
  __sodhaniMongoClientPromise?: Promise<MongoClient>;
};

async function getMongoClient() {
  const globalForMongo = globalThis as MongoGlobal;

  if (!globalForMongo.__sodhaniMongoClientPromise) {
    const { MONGODB_URI } = getAuthConfig();
    globalForMongo.__sodhaniMongoClientPromise = new MongoClient(MONGODB_URI).connect().catch((error) => {
      delete globalForMongo.__sodhaniMongoClientPromise;
      throw error;
    });
  }

  return globalForMongo.__sodhaniMongoClientPromise;
}

export async function getAuthDb(): Promise<Db> {
  const client = await getMongoClient();
  const { mongoDbName } = getAuthConfig();

  return client.db(mongoDbName);
}

export async function ensureAuthIndexes() {
  const globalForMongo = globalThis as MongoGlobal;

  if (globalForMongo.__sodhaniAuthIndexesPromise) {
    return globalForMongo.__sodhaniAuthIndexesPromise;
  }

  globalForMongo.__sodhaniAuthIndexesPromise = createAuthIndexes().catch((error) => {
    delete globalForMongo.__sodhaniAuthIndexesPromise;
    throw error;
  });

  return globalForMongo.__sodhaniAuthIndexesPromise;
}

async function createAuthIndexes() {
  const db = await getAuthDb();

  await Promise.all([
    createIndex(
      db,
      "users",
      { phoneE164: 1 },
      {
        name: "users_phoneE164_unique",
        unique: true,
        partialFilterExpression: { phoneE164: { $type: "string" } }
      }
    ),
    createIndex(
      db,
      "users",
      { emailNorm: 1 },
      {
        name: "users_emailNorm_unique",
        unique: true,
        partialFilterExpression: { emailNorm: { $type: "string" } }
      }
    ),
    createIndex(
      db,
      "users",
      { googleSub: 1 },
      {
        name: "users_googleSub_unique",
        unique: true,
        partialFilterExpression: { googleSub: { $type: "string" } }
      }
    ),
    createIndex(db, "otp_challenges", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
    createIndex(db, "otp_challenges", { phoneE164: 1, createdAt: -1 }),
    createIndex(db, "auth_sessions", { tokenHash: 1 }, { unique: true }),
    createIndex(db, "auth_sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 }),
    createIndex(db, "auth_sessions", { userId: 1, expiresAt: 1 })
  ]);
}

async function createIndex(
  db: Db,
  collectionName: string,
  keys: IndexSpecification,
  options: CreateIndexesOptions = {}
) {
  const collection = db.collection(collectionName);
  const existingIndexes = await collection.listIndexes().toArray();

  if (
    existingIndexes.some(
      (index) =>
        sameObject(index.key, keys) &&
        sameIndexOption(index.unique, options.unique) &&
        sameIndexOption(index.expireAfterSeconds, options.expireAfterSeconds) &&
        sameObject(index.partialFilterExpression, options.partialFilterExpression)
    )
  ) {
    return;
  }

  try {
    await collection.createIndex(keys, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Index already exists with a different name")) {
      return;
    }

    throw error;
  }
}

function sameIndexOption(existing: unknown, expected: unknown) {
  return expected === undefined || existing === expected;
}

function sameObject(existing: unknown, expected: unknown) {
  if (expected === undefined) {
    return true;
  }

  return JSON.stringify(existing) === JSON.stringify(expected);
}
