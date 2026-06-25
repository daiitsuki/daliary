import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = ({
  variant = "primary",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "w-full py-4 rounded-2xl font-black text-sm transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#ff496b] text-white hover:bg-[#ff2759]",
    secondary: "text-gray-600 border bg-gray-100 hover:bg-gray-200 border-0",
    danger: "bg-rose-50 text-rose-500 hover:bg-rose-100",
    ghost:
      "bg-transparent text-gray-400 underline decoration-gray-300 underline-offset-4 hover:text-gray-600 hover:decoration-gray-600",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export default Button;
