import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Repo root (CSTI/.env.local) then backend/.env.local — same keys in backend win.
const rootEnv = path.resolve(__dirname, '..', '..', '.env.local');
const backendEnv = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: rootEnv });
dotenv.config({ path: backendEnv, override: true });
