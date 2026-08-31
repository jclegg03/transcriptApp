function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 8080),
  maxActiveRooms: Number(process.env.MAX_ACTIVE_ROOMS ?? 5),
  maxListenersPerRoom: Number(process.env.MAX_LISTENERS_PER_ROOM ?? 500),
  // Empty allowlist permits any origin (dev default) — set explicitly in production.
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
};
