import * as React from "react";

import { cn } from "@/modules/ui/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "retro-display inline-flex min-h-9 items-center gap-2 rounded-none border border-border/70 bg-secondary/70 px-3 py-2 text-[0.56rem] uppercase tracking-[0.22em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
