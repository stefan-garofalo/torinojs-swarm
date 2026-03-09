"use client";

import * as React from "react";

import { Label as BaseLabel } from "@/modules/ui/label";
import { cn } from "@/modules/ui/utils";

function Label({ className, ...props }: React.ComponentProps<typeof BaseLabel>) {
  return (
    <BaseLabel
      className={cn("retro-display text-[0.58rem] tracking-[0.22em] text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Label };
