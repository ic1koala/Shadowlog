/**
 * Official Threads API Configuration & Credential Resolvers
 */

export const DEFAULT_THREADS_APP_ID = "2269376183852980";
export const DEFAULT_THREADS_USER_ID = "28950072177912104";
export const DEFAULT_THREADS_ACCESS_TOKEN = "";

export function getThreadsUserId(): string {
  return process.env.THREADS_USER_ID || DEFAULT_THREADS_USER_ID;
}

export function getThreadsAccessToken(): string {
  return process.env.THREADS_ACCESS_TOKEN || DEFAULT_THREADS_ACCESS_TOKEN;
}

export function getThreadsAppId(): string {
  return process.env.THREADS_APP_ID || DEFAULT_THREADS_APP_ID;
}
