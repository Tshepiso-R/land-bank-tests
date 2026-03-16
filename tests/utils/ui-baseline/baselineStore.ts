// Reads and writes baseline JSON files from the baselines/ directory.
import * as fs from 'fs';
import * as path from 'path';
import { PageSnapshot } from './snapshotPage';

const BASELINES_DIR = path.join(__dirname, '..', '..', '..', 'baselines');

export function baselineExists(pageName: string): boolean {
  return fs.existsSync(path.join(BASELINES_DIR, `${pageName}.json`));
}

export function loadBaseline(pageName: string): PageSnapshot | null {
  const filePath = path.join(BASELINES_DIR, `${pageName}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function saveBaseline(pageName: string, snapshot: PageSnapshot): void {
  if (!fs.existsSync(BASELINES_DIR)) fs.mkdirSync(BASELINES_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(BASELINES_DIR, `${pageName}.json`),
    JSON.stringify(snapshot, null, 2),
  );
}
