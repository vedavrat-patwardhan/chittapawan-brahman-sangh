export const SESSION_COOKIE_NAME = "cbs_session";

/** Temporary static credentials until real auth is wired up. */
export const STATIC_AUTH = {
  username: process.env.AUTH_USERNAME ?? "admin",
  password: process.env.AUTH_PASSWORD ?? "admin",
} as const;

/** Cookie value issued after a successful login. Override in production via env. */
export function getSessionToken(): string {
  return process.env.AUTH_SESSION_TOKEN ?? "cbs-dev-session-token";
}

export function credentialsMatch(identifier: string, password: string): boolean {
  const id = identifier.trim().toLowerCase();
  const allowedIds = [
    STATIC_AUTH.username.toLowerCase(),
    `${STATIC_AUTH.username}@local`,
    "admin@admin.com",
  ];
  return allowedIds.includes(id) && password === STATIC_AUTH.password;
}
