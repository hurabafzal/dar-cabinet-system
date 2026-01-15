import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/libs/utils";

const radioGroupVariants = cva("flex flex-col space-y-2");

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof radioGroupVariants> {}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(radioGroupVariants(), className)} {...props}>
        {children}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="inline-flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          ref={ref}
          className={cn(
            "form-radio text-[#0d5362] border-gray-300 dark:border-gray-700 focus:ring-[#0d5362]",
            className
          )}
          {...props}
        />
        <span>{props.children}</span>
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";
