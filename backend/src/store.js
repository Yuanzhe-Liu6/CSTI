// In-memory result store. Good enough for MVP — swap for SQLite/Redis later.
const results = new Map();
const typeCounts = new Map();

export function saveResult(result) {
  results.set(result.id, result);
  typeCounts.set(result.typeCode, (typeCounts.get(result.typeCode) ?? 0) + 1);
  return result;
}

export function getResult(id) {
  return results.get(id) ?? null;
}

export function getStats() {
  const total = Array.from(typeCounts.values()).reduce((a, b) => a + b, 0);
  const distribution = Object.fromEntries(typeCounts);
  return { total, distribution };
}
