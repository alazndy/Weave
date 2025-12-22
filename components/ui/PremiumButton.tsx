import React from "react";
import { Loader2 } from "lucide-react";

// Inline simple cn
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "premium" | "glass" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
    
    // Variants
    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
        premium: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-indigo-500/25 border-0 hover:scale-[1.02]",
        glass: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-sm hover:shadow-md",
        ghost: "hover:bg-white/5 hover:text-white",
        outline: "border border-white/20 bg-transparent hover:bg-white/5 hover:text-white",
        destructive: "bg-red-600 text-white hover:bg-red-700",
    };

    // Sizes
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
PremiumButton.displayName = "PremiumButton";
