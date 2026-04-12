import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

const USE_MEMORY = !process.env.MONGODB_URI;

/** In-memory fallback when MONGODB_URI is unset (local dev). */
const results = new Map();
const typeCounts = new Map();
/** @type {Array<object>} */
const feedbackMemory = [];

let client;
let mongoCollection;
let connectPromise;

async function getCollection() {
  if (mongoCollection) return mongoCollection;
  if (!connectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    connectPromise = (async () => {
      client = new MongoClient(uri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB_NAME || 'csti');
      mongoCollection = db.collection('results');
      await mongoCollection.createIndex({ createdAt: -1 });
    })();
  }
  try {
    await connectPromise;
  } catch (e) {
    connectPromise = undefined;
    throw e;
  }
  return mongoCollection;
}

/**
 * Persist a quiz result. With MONGODB_URI (Atlas), writes to MongoDB; otherwise in-memory.
 */
export async function saveResult(result) {
  if (USE_MEMORY) {
    results.set(result.id, result);
    typeCounts.set(result.typeCode, (typeCounts.get(result.typeCode) ?? 0) + 1);
    return result;
  }
  const col = await getCollection();
  await col.insertOne({
    _id: result.id,
    createdAt: result.createdAt,
    typeCode: result.typeCode,
    raw: result.raw,
    normalized: result.normalized,
    archetype: result.archetype,
    personalRoasts: result.personalRoasts,
  });
  return result;
}

export async function getResult(id) {
  if (USE_MEMORY) {
    return results.get(id) ?? null;
  }
  const col = await getCollection();
  const doc = await col.findOne({ _id: id });
  if (!doc) return null;
  return {
    id: doc._id,
    createdAt: doc.createdAt,
    typeCode: doc.typeCode,
    raw: doc.raw,
    normalized: doc.normalized,
    archetype: doc.archetype,
    personalRoasts: doc.personalRoasts,
  };
}

/**
 * Persist user feedback (like score, fit vibe, tags, optional comment). Optional resultId links to a quiz result.
 */
export async function saveFeedback(payload) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const doc = {
    _id: id,
    createdAt,
    resultId: payload.resultId ?? null,
    stars: payload.stars,
    vibe: payload.vibe,
    tags: payload.tags ?? [],
    comment: payload.comment ?? '',
  };
  if (USE_MEMORY) {
    feedbackMemory.push(doc);
    return { id, createdAt };
  }
  await getCollection();
  const dbName = process.env.MONGODB_DB_NAME || 'csti';
  const col = client.db(dbName).collection('feedback');
  await col.insertOne(doc);
  return { id, createdAt };
}

export async function getStats() {
  if (USE_MEMORY) {
    const total = Array.from(typeCounts.values()).reduce((a, b) => a + b, 0);
    const distribution = Object.fromEntries(typeCounts);
    return { total, distribution };
  }
  const col = await getCollection();
  const total = await col.countDocuments();
  const rows = await col
    .aggregate([{ $group: { _id: '$typeCode', count: { $sum: 1 } } }])
    .toArray();
  const distribution = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return { total, distribution };
}

/** Close MongoDB connection (e.g. tests or graceful shutdown). */
export async function closeStore() {
  if (client) {
    await client.close();
    client = undefined;
    mongoCollection = undefined;
    connectPromise = undefined;
  }
}
