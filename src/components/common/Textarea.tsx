import React, {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
} from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { inputVariants } from "./Input";

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      helperText,
      wrapperClassName,
      id,
      onChange,
      required,
      maxLength,
      value,
      defaultValue,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || Math.random().toString(36).substring(7);
    const isError = variant === "error" || !!error;
    const currentVariant = isError ? "error" : variant;

    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    const [internalValue, setInternalValue] = useState(
      String(defaultValue || ""),
    );
    const valueLength =
      value !== undefined ? String(value).length : internalValue.length;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-bold text-gray-700 ml-1 flex items-center"
          >
            {label}
            {required && (
              <span className="text-rose-500 ml-1 leading-none">*</span>
            )}
          </label>
        )}
        <textarea
          ref={innerRef}
          id={textareaId}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            inputVariants({ variant: currentVariant, size }),
            "resize-none custom-scrollbar leading-relaxed",
            className,
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";

export default Textarea;
