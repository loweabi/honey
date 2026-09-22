type DatabaseError = { message?: string; code?: string } | null;

/**
 * Turns a database error into something a store worker can read.
 * Messages raised by our own database functions (code P0001) are already plain language.
 */
export function friendlyMessage(error: DatabaseError, fallback: string): string {
  if (!error) return fallback;
  if (error.code === 'P0001' && error.message) return error.message;
  if (error.code === '23505') return 'Something with that name already exists.';
  if (error.message && /failed to fetch|network|load failed/i.test(error.message)) {
    return 'No internet connection. Please check your connection and try again.';
  }
  return fallback;
}

export function throwIfError(error: DatabaseError, fallback: string): void {
  if (error) throw new Error(friendlyMessage(error, fallback));
}

export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
