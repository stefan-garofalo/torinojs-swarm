"use client";
import { authClient } from "@/modules/auth/auth-client";

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  return <></>;
}
