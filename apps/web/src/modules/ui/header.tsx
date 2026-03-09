"use client";
import Link from "next/link";

import UserMenu from "@/modules/auth/components/user-menu";
import { Badge, Button } from "@/modules/ui/8bit";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/design-system", label: "Design System" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="border-b border-border/80 bg-black/35 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="retro-display terminal-copy text-base leading-none text-foreground">
              The Reaping
            </Link>
            <Badge className="bg-primary/14 text-primary-foreground">TOR-48 Foundation</Badge>
            <span className="retro-copy inline-flex items-center gap-2 text-[0.64rem] text-muted-foreground">
              <span className="status-led h-2 w-2 bg-primary" />
              Dark-only feed
            </span>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label }) => {
              return (
                <Link key={to} href={to}>
                  <Button size="sm" variant={to === "/design-system" ? "default" : "outline"}>
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
