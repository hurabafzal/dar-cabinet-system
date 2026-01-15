import * as React from "react";
import { cn } from "@/libs/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const buttonVariants = {
  default: "bg-[#0d5362] text-white hover:bg-[#0d5362]/90",
  outline: "border border-gray-300 text-gray-900 hover:bg-gray-100",
  ghost: "text-gray-700 hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1 text-sm",
  lg: "px-5 py-3 text-base",
  icon: "p-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variantClass = buttonVariants[variant];
    const sizeClass = buttonSizes[size];

    return (
      <button
        ref={ref}
        className={cn(base, variantClass, sizeClass, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
