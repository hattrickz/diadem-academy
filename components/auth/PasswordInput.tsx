"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  name,
  label,
  autoComplete,
  required = true,
}: {
  name: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  required?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-navy-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          minLength={8}
          aria-label={label ? undefined : "Password"}
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 pr-11 text-sm text-navy-800 placeholder:text-navy-700/40 focus:border-skyblue-500 focus:outline-none focus:ring-2 focus:ring-skyblue-200"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-navy-700/60 hover:text-navy-800"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
