import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

const readJson = (name) =>
  JSON.parse(readFileSync(join(dataDir, name), 'utf-8'));

export const questionsData = readJson('questions.json');
export const archetypesData = readJson('archetypes.json');
export const roastsData = readJson('roasts.json');

export const questions = questionsData.questions;
export const archetypes = archetypesData.archetypes;
export const roasts = roastsData.lines;

// Index questions by id and axis for fast lookup.
export const questionsById = new Map(questions.map((q) => [q.id, q]));

export const questionsByAxis = questions.reduce((acc, q) => {
  (acc[q.axis] ||= []).push(q);
  return acc;
}, {});

export const archetypeByCode = new Map(archetypes.map((a) => [a.code, a]));
