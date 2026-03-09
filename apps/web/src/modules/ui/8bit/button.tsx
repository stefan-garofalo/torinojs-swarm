import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { Button as BaseButton } from "@/modules/ui/button";
import { cn } from "@/modules/ui/utils";

const eightBitButtonVariants = cva(
  "pixel-frame retro-display retro-copy relative isolate min-h-11 rounded-none border-0 px-4 py-3 text-[0.64rem] leading-none uppercase tracking-[0.22em] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(178,46,34,0.24)] hover:bg-[color:color-mix(in_oklab,var(--primary)_88%,black)]",
        outline:
          "bg-card/90 text-foreground shadow-[inset_0_0_0_1px_var(--terminal-edge),0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-secondary/80",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
        terminal:
          "bg-[rgba(255,196,125,0.06)] text-[var(--terminal-amber)] shadow-[0_0_18px_rgba(255,196,125,0.12)] hover:bg-[rgba(255,196,125,0.12)]",
      },
      size: {
        default: "",
        sm: "min-h-10 px-3 py-2 text-[0.58rem]",
        lg: "min-h-12 px-5 py-4 text-[0.7rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type EightBitButtonProps = Omit<React.ComponentProps<typeof BaseButton>, "variant" | "size"> &
  VariantProps<typeof eightBitButtonVariants>;

function Button({ className, variant, size, ...props }: EightBitButtonProps) {
  return (
    <BaseButton
      className={cn(eightBitButtonVariants({ variant, size }), className)}
      variant="ghost"
      size="default"
      {...props}
    />
  );
}

export { Button, eightBitButtonVariants };
