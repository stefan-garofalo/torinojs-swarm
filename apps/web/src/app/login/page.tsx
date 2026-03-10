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
            <Badge className="bg-primary/14 text-primary-foreground">RESTRICTED</Badge>
            <CardTitle className="text-base md:text-xl">AUTHENTICATION REQUIRED</CardTitle>
            <CardDescription>
              Identity verification mandatory before terminal access. The authentication protocol has been
              assimilated into the monochrome decay of the entire system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pixel-frame bg-black/30 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">CREDENTIALS</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                Email/password authentication persists. External OAuth gateways remain isolated from this
                implementation.
              </p>
            </div>
            <div className="pixel-frame bg-black/30 p-4">
              <p className="retro-display mb-3 text-[0.52rem] text-accent">CONSTRAINT</p>
              <p className="retro-copy text-sm leading-6 text-muted-foreground">
                TOR-48 demonstrates unified visual degradation across shell and auth surfaces before state
                tracking corruption begins.
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
