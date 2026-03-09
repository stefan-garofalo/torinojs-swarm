import * as React from "react";

import { cn } from "@/modules/ui/utils";

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("terminal-panel pixel-frame rounded-none", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-3 border-b border-border/80 px-5 py-5", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("retro-display text-[0.72rem] text-foreground", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("retro-copy text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-4 px-5 py-5", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("border-t border-border/80 px-5 py-4 retro-copy text-xs", className)} {...props} />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
