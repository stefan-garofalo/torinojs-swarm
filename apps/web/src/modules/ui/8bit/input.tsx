import * as React from "react";

import { Input as BaseInput } from "@/modules/ui/input";
import { cn } from "@/modules/ui/utils";

function Input({ className, ...props }: React.ComponentProps<typeof BaseInput>) {
  return (
    <BaseInput
      className={cn(
        "pixel-frame retro-copy min-h-11 rounded-none border-0 bg-input/90 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/90 focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
