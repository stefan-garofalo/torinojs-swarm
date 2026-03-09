"use client";

import { useState } from "react";

import SignInForm from "@/modules/auth/components/sign-in-form";
import SignUpForm from "@/modules/auth/components/sign-up-form";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/ui/8bit";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <main className="hud-grid min-h-full px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <Badge className="bg-primary/14 text-primary-foreground">Access Gate</Badge>
            <CardTitle className="text-base md:text-xl">Mandatory sign-in before the feed opens</CardTitle>
            <CardDescription>
              This story keeps the existing auth behavior intact. The change here is presentation: the auth
              flow now lives inside the same cabinet language as the rest of the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pixel-frame bg-black/20 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">Current mode</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                Email/password remains in place for now. GitHub OAuth is handled by a separate issue.
              </p>
            </div>
            <div className="pixel-frame bg-black/20 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">Scope</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                TOR-48 proves the shell and auth routes can share the same design system before betting or combat UI exists.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 lg:order-2">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </main>
  );
}
