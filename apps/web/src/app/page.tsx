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
              <p className="retro-display text-[0.56rem] text-accent">SURVEILLANCE ACTIVE</p>
              <CardTitle className="max-w-3xl text-base md:text-xl">
                THE TERMINAL DOES NOT REMEMBER WHO YOU WERE
              </CardTitle>
              <CardDescription>
                TOR-48 erases the warm nostalgia with dead phosphor glow. Monochrome decay, oppressive
                shadows, and abandoned system aesthetics define the new visual prison.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="pixel-frame bg-black/30 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">CORRUPTED</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Grim primitives consume the interface. Color has been purged.
                </p>
              </div>
              <div className="pixel-frame bg-black/30 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">STATIC</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Dead monitor aesthetics. Cold shadows. Grayscale oppression.
                </p>
              </div>
              <div className="pixel-frame bg-black/30 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">PROPAGATED</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  The decay spreads to downstream systems. No escape.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-3">
              <Link href="/design-system">
                <Button size="sm">INSPECT RUINS</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">ACCESS DENIED</Button>
              </Link>
              <Badge className="bg-primary/14 text-primary-foreground">MONOCHROME</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <p className="retro-display text-[0.56rem] text-accent">SYSTEM LOG</p>
              <CardTitle>DEGRADATION STATUS</CardTitle>
              <CardDescription>
                TOR-48 stops at visual annihilation. Further corruption will inject state tracking,
                ghostly feeds, and surveillance widgets into this decaying shell.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pixel-frame bg-black/30 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">IMPLEMENTED</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Monochrome tokens, dead phosphor glow, static grain, oppressive shadows, and a
                  lifeless design-system morgue.
                </p>
              </div>
              <div className="pixel-frame bg-black/30 p-4">
                <p className="retro-display mb-3 text-[0.52rem] text-accent">AWAITING CORRUPTION</p>
                <p className="retro-copy text-sm leading-6 text-muted-foreground">
                  Surveillance feeds, decay meters, ghost traces, static bursts, and terminal
                  malfunctions remain outside this iteration.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
