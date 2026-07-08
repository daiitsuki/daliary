import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "rounded-2xl font-black transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary: "text-gray-600 bg-gray-100 hover:bg-gray-200",
        outline: "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50",
        "outline-primary": "text-primary bg-white border-2 border-rose-100 hover:bg-rose-50",
        danger: "bg-red-500 text-white hover:bg-red-600",
        "danger-ghost": "bg-transparent text-gray-400 hover:bg-red-50 hover:text-red-500",
        link: "bg-transparent text-gray-400 underline decoration-gray-300 underline-offset-4 hover:text-gray-600 hover:decoration-gray-600",
      },
      size: {
        sm: "py-2 px-4 text-xs rounded-xl",
        md: "py-3 px-5 text-sm",
        lg: "py-4 px-6 text-sm",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      fullWidth: true,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
