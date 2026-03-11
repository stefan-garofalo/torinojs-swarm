export async function importUpstashRedisModule(): Promise<typeof import("@upstash/redis")> {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier);",
  ) as (specifier: string) => Promise<typeof import("@upstash/redis")>;

  return dynamicImport("@upstash/redis");
}
