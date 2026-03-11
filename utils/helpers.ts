export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
