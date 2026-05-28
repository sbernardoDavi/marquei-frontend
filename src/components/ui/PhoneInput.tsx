import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "../../utils/cn";
import { phoneMask } from "../../utils/formatters";

interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, onChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(
      value ? phoneMask(String(value)) : "",
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const masked = phoneMask(inputValue);
      setDisplayValue(masked);

      // Retorna apenas os números para o formulário
      const numbers = inputValue.replace(/\D/g, "");
      if (onChange) {
        onChange(numbers);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type="tel"
          className={cn(
            "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors",
            error ? "border-danger-500" : "border-gray-300",
            className,
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          maxLength={15}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
