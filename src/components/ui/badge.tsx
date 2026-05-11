import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyled = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    destructive: "border-transparent bg-[#ef4444] text-white shadow hover:bg-[#dc2626]",
    outline: "text-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
  };

  return (
    <div className={cn(baseStyled, variants[variant], className)} {...props} />
  );
}

export { Badge }
