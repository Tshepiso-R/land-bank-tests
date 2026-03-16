// Compares two page snapshots and returns the differences.
import { UIElement, PageSnapshot } from './snapshotPage';

export interface SnapshotDiff {
  added: UIElement[];
  removed: UIElement[];
  summary: string;
}

function elementKey(el: UIElement): string {
  return `${el.tag}|${el.role || ''}|${el.text || ''}|${el.name || ''}|${el.placeholder || ''}|${el.type || ''}`;
}

function elementLabel(el: UIElement): string {
  return `${el.tag}${el.role ? `[${el.role}]` : ''}: "${el.text || el.name || el.placeholder || '(empty)'}"`;
}

/** Compare baseline and current snapshots. Returns diff with human-readable summary. */
export function compareSnapshots(baseline: PageSnapshot, current: PageSnapshot): SnapshotDiff {
  const baselineKeys = new Map(baseline.elements.map(el => [elementKey(el), el]));
  const currentKeys = new Map(current.elements.map(el => [elementKey(el), el]));

  const added: UIElement[] = [];
  const removed: UIElement[] = [];

  for (const [key, el] of currentKeys) {
    if (!baselineKeys.has(key)) added.push(el);
  }
  for (const [key, el] of baselineKeys) {
    if (!currentKeys.has(key)) removed.push(el);
  }

  const lines: string[] = [];
  if (added.length) {
    lines.push(`NEW elements (${added.length}):`);
    added.forEach(el => lines.push(`  + ${elementLabel(el)}`));
  }
  if (removed.length) {
    lines.push(`MISSING elements (${removed.length}):`);
    removed.forEach(el => lines.push(`  - ${elementLabel(el)}`));
  }

  return {
    added,
    removed,
    summary: lines.length ? lines.join('\n') : 'No differences',
  };
}
