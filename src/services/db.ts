export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
