import "server-only";

import { getAuthSessionFromHeaders } from "@reaping/auth";
import { headers } from "next/headers";

export async function getServerSession() {
  return getAuthSessionFromHeaders(new Headers(await headers()));
}
