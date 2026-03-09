import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/modules/ui/8bit";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="hud-grid min-h-full px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <p className="retro-display text-[0.56rem] text-accent">Mandatory spectatorship</p>
              <CardTitle className="max-w-3xl text-base md:text-xl">
                The cabinet finally looks like it can choose who survives
              </CardTitle>
              <CardDescription>
                TOR-48 replaces the default starter shell with a retro-dark broadcast surface. The design
                system route, tokens, and 8bit primitives are now the visual contract for the next UI stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="pixel-frame bg-black/20 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">Foundation</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Local 8bit primitives replace generic shell chrome.
                </p>
              </div>
              <div className="pixel-frame bg-black/20 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">Shell</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Dark-only tokens, CRT atmosphere, and cabinet framing.
                </p>
              </div>
              <div className="pixel-frame bg-black/20 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">Downstream</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  TOR-49 and TOR-50 inherit the same UI language instead of reinventing it.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-3">
              <Link href="/design-system">
                <Button size="sm">Open Design System</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Enter Auth Gate</Button>
              </Link>
              <Badge className="bg-primary/14 text-primary-foreground">8bitcn-adapted</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <p className="retro-display text-[0.56rem] text-accent">Runtime Feed</p>
              <CardTitle>Implementation status</CardTitle>
              <CardDescription>
                TOR-48 intentionally stops at reusable UI foundation. The next stories will plug actual
                betting, action-log, and state widgets into this shell.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pixel-frame bg-black/20 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">Delivered now</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Dark-only tokens, local 8bit primitives, CRT styling, responsive auth screens, and a
                  live design-system route.
                </p>
              </div>
              <div className="pixel-frame bg-black/20 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">Deferred to next issues</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Wallet displays, betting windows, HP bars, action feeds, and combat transitions remain
                  intentionally out of scope for this branch.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
