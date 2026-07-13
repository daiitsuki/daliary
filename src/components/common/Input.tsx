import React, {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export const inputVariants = cva(
  "w-full rounded-2xl bg-gray-50 border-2 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:border-transparent disabled:hover:border-transparent disabled:focus:ring-0 disabled:focus:border-transparent",
  {
    variants: {
      variant: {
        default:
          "border-transparent hover:bg-gray-100 hover:border-transparent focus:border-rose-200 focus:ring-2 focus:ring-rose-200 focus:bg-white",
        error:
          "border-transparent bg-red-50 text-red-900 hover:bg-red-100 hover:border-transparent focus:border-red-200 focus:ring-2 focus:ring-red-200 focus:bg-white placeholder-red-300",
        success:
          "border-transparent bg-green-50 text-green-900 hover:bg-green-100 hover:border-transparent focus:border-green-200 focus:ring-2 focus:ring-green-200 focus:bg-white placeholder-green-300",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      wrapperClassName,
      clearable = true,
      onClear,
      id,
      onChange,
      required,
      maxLength,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const inputId = id || Math.random().toString(36).substring(7);
    const isError = variant === "error" || !!error;
    const currentVariant = isError ? "error" : variant;

    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const [internalValue, setInternalValue] = useState(
      String(defaultValue || ""),
    );
    const valueLength =
      value !== undefined ? String(value).length : internalValue.length;
    const hasValue = valueLength > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    const handleClear = () => {
      if (innerRef.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(innerRef.current, "");

        const event = new Event("input", { bubbles: true });
        innerRef.current.dispatchEvent(event);

        if (onClear) onClear();

        innerRef.current.focus();
      }
    };

    const showClearButton =
      clearable && hasValue && !props.disabled && !props.readOnly;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-gray-700 ml-1 flex items-center"
          >
            {label}
            {required && (
              <span className="text-rose-500 ml-1 leading-none">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-gray-400 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={innerRef}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            required={required}
            maxLength={maxLength}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              leftIcon && "pl-11",
              showClearButton && rightIcon
                ? "pr-[4.5rem]"
                : showClearButton || rightIcon
                  ? "pr-11"
                  : "",
              className,
            )}
            {...props}
          />
          <div className="absolute right-4 flex items-center gap-2">
            {showClearButton && (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleClear}
                className="text-white bg-gray-300 hover:bg-gray-400 transition-colors flex items-center justify-center rounded-full w-[18px] h-[18px]"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
            {rightIcon && (
              <div className="text-gray-400 flex items-center">{rightIcon}</div>
            )}
          </div>
        </div>
        {(error || helperText || maxLength) && (
          <div className="flex items-start justify-between px-1">
            <p
              className={cn(
                "text-xs font-semibold",
                isError ? "text-red-500" : "text-gray-500",
                !(error || helperText) && "invisible",
              )}
            >
              {error || helperText || "placeholder"}
            </p>
            {maxLength && (
              <span className="text-[11px] sm:text-xs font-bold text-gray-400 shrink-0 ml-4">
                {valueLength} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
