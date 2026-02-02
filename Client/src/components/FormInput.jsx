/**
 * FormInput Component - Reusable form input with validation
 * 
 * FEATURES:
 * - Consistent styling
 * - Error display
 * - Label and helper text
 * - Various input types support
 */

import { forwardRef } from 'react';

const FormInput = forwardRef(function FormInput(
  {
    label,
    error,
    helperText,
    type = 'text',
    required = false,
    className = '',
    ...props
  },
  ref
) {
  const inputId = props.id || props.name;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-bold text-sm"
        >
          {label}
          {required && <span className="text-[var(--color-primary)] ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        id={inputId}
        className={`brutal-input ${error ? 'border-[var(--color-primary)]' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-[var(--color-primary)] text-sm font-medium flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-gray-600 text-sm">{helperText}</p>
      )}
    </div>
  );
});

export default FormInput;
