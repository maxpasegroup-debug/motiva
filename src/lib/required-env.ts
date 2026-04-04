export function requiredEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `[env] ${name} is missing or empty. Set it in Railway Variables or copy .env.example to .env / .env.local.`,
    );
  }
  return trimmed;
}
