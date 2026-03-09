"use client";
import { authClient } from "@/modules/auth/auth-client";

export default function Dashboard({ session: _session }: { session: typeof authClient.$Infer.Session }) {
  return <></>;
}
