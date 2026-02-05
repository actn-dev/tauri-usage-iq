import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled, error }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, newValue: string) => {
    // Only allow numbers
    const sanitized = newValue.replace(/\D/g, "");
    if (!sanitized) {
      // Handle backspace/delete
      const newOtp = value.split("");
      newOtp[index] = "";
      onChange(newOtp.join(""));
      
      // Move to previous input
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Take only the last digit if multiple are entered
    const digit = sanitized.slice(-1);
    const newOtp = value.split("");
    newOtp[index] = digit;
    onChange(newOtp.join(""));

    // Move to next input if available
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    onChange(pastedData);
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          // @ts-ignore dur sala
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
            ${error 
              ? "border-red-500 bg-red-500/10 text-red-300" 
              : "border-slate-700 bg-slate-900/50 text-slate-200"
            }
            ${!disabled && !error ? "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            focus:outline-none
          `}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
