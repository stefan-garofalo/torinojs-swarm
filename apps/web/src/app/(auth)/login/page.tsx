"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/modules/auth/auth-client";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/ui/8bit";
import Loader from "@/modules/ui/loader";

export default function LoginPage() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const signInWithGitHub = async () => {
    await authClient.signIn.social(
      { provider: "github", callbackURL: "/" },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText);
        },
      },
    );
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <main className="hud-grid min-h-full px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <Badge className="bg-primary/14 text-primary-foreground">RESTRICTED</Badge>
            <CardTitle className="text-base md:text-xl">GITHUB IDENTITY CHECKPOINT</CardTitle>
            <CardDescription>
              Terminal access is routed through a single external identity gate. Email and password entry
              points were removed from the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pixel-frame bg-black/30 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">AUTH PATH</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                Continue with GitHub to establish a session, then return to the protected terminal root.
              </p>
            </div>
            <div className="pixel-frame bg-black/30 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">GUARDRAIL</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                Anonymous access is blocked outside this auth surface. Sign-out returns here immediately.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <Badge className="bg-primary/14 text-primary-foreground">OAUTH ONLY</Badge>
            <CardTitle className="text-base md:text-xl">ENTER THROUGH GITHUB</CardTitle>
            <CardDescription>
              Better Auth is configured for GitHub social sign-in only, with the app root as the callback
              target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" className="w-full" onClick={signInWithGitHub}>
              Continue with GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
