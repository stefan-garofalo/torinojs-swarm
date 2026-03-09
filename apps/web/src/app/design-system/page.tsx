import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/modules/ui/8bit";

const sections = [
  {
    title: "Palette",
    description: "Near-black phosphor, arterial reds, and stale gold warnings tuned for projection and mobile contrast.",
  },
  {
    title: "Typography",
    description: "Pixel display text commands the hierarchy while mono body copy keeps the interface legible under pressure.",
  },
  {
    title: "Controls",
    description: "Stepped controls, hard borders, and cabinet framing replace generic rounded app chrome.",
  },
  {
    title: "Surfaces",
    description: "Every panel reads like a terminal housing: boxed, layered, and slightly degraded by the feed.",
  },
  {
    title: "Motion",
    description: "Signal pulse and soft flicker carry urgency without consuming the future gameplay transitions.",
  },
  {
    title: "Responsive",
    description: "The foundation compresses into stacked mobile layouts without shrinking touch targets into decoration.",
  },
] as const;

const palette = [
  { label: "Background", className: "bg-background" },
  { label: "Card", className: "bg-card" },
  { label: "Primary", className: "bg-primary" },
  { label: "Accent", className: "bg-accent" },
] as const;

export default function DesignSystemPage() {
  return (
    <main className="hud-grid min-h-full px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <p className="retro-display text-[0.56rem] text-accent">Design System</p>
              <CardTitle className="max-w-3xl text-base md:text-xl">
                Retro broadcast cabinet for the Reaping
              </CardTitle>
              <CardDescription>
                This route is the handoff surface for TOR-49 and TOR-50. It exists to prove the dark
                cabinet language, not to preview betting or combat UI.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <div key={section.title} className="pixel-frame bg-black/20 p-4">
                  <p className="retro-display mb-3 text-[0.52rem] text-accent">{section.title}</p>
                  <p className="retro-copy text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-3">
              <Link href="/">
                <Button size="sm">Return Home</Button>
              </Link>
              <Badge>No gameplay widgets</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <p className="retro-display text-[0.56rem] text-accent">Controls</p>
              <CardTitle>Preview Console</CardTitle>
              <CardDescription>Local 8bit primitives with the final tone and spacing rules applied.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="showcase-handle">Handle</Label>
                <Input id="showcase-handle" defaultValue="spectator-07" />
              </div>
              <CardAction>
                <Button>Arm Feed</Button>
                <Button variant="outline">Observe</Button>
                <Button variant="terminal">Mute</Button>
              </CardAction>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/14 text-primary-foreground">Terminal / CRT</Badge>
                <Badge>Mobile-safe layout</Badge>
                <Badge>Dark only</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Palette</CardTitle>
              <CardDescription>Core tokens for downstream game widgets.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {palette.map((entry) => (
                <div key={entry.label} className="pixel-frame bg-black/20 p-3">
                  <div className={`mb-3 h-16 w-full border border-border ${entry.className}`} />
                  <p className="retro-display text-[0.52rem] text-accent">{entry.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Motion</CardTitle>
              <CardDescription>
                Ambient movement stays structural and reusable. Story-specific death or countdown effects belong to later issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="pixel-frame flex min-h-32 items-center justify-center bg-black/25 p-6">
                <div className="flicker-soft flex flex-col items-center gap-3">
                  <span className="status-led h-3 w-3 bg-primary" />
                  <span className="retro-display text-[0.52rem]">Signal pulse</span>
                </div>
              </div>
              <div className="terminal-panel flex min-h-32 items-center justify-center p-6">
                <span className="retro-display terminal-copy text-[0.52rem]">Soft flicker</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
