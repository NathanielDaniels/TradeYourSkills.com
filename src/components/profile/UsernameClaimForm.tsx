// src/components/profile/UsernameClaimForm.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUsername } from '@/hooks/useUsername';
import { Loader2, Check, X, AlertCircle, Clock } from 'lucide-react';

interface UsernameClaimFormProps {
  onSuccess?: (username: string) => void;
  onCancel?: () => void;
}

export default function UsernameClaimForm({ onSuccess, onCancel }: UsernameClaimFormProps) {
  const [rawInput, setRawInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  
  const {
    validation,
    rateLimit,
    isSubmitting,
    validateUsername,
    sanitizeUsername,
    checkAvailability,
    claimUsername,
    currentUsername,
    hasUsername,
  } = useUsername();

  // Debounce input for availability checking
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(rawInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [rawInput]);

  // Check availability when debounced input changes
  useEffect(() => {
    if (debouncedInput && debouncedInput !== currentUsername) {
      checkAvailability(debouncedInput);
    }
  }, [debouncedInput, currentUsername, checkAvailability]);

  const sanitized = useMemo(() => sanitizeUsername(rawInput), [rawInput, sanitizeUsername]);
  const validationError = useMemo(() => validateUsername(sanitized), [sanitized, validateUsername]);
  const isValid = !validationError && sanitized.length >= 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const sanitized = sanitizeUsername(input);
    setRawInput(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || isSubmitting) return;

    const result = await claimUsername(sanitized);
    if (result.success && result.username) {
      onSuccess?.(result.username);
    }
  };

  // Get status icon and color
  const getStatusIcon = () => {
    if (validation.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (validationError) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    if (validation.isAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (validation.isAvailable === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (validation.isChecking) return 'Checking availability...';
    if (validationError) return validationError;
    if (validation.isAvailable === true) return 'Username is available!';
    if (validation.isAvailable === false) return 'Username is already taken';
    if (sanitized && sanitized === currentUsername) return 'This is your current username';
    return null;
  };

  const statusMessage = getStatusMessage();
  const canSubmit = isValid && validation.isAvailable === true && !isSubmitting;

  return (
    <div className="space-y-4">
      {/* Rate limit info */}
      {rateLimit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <Clock className="h-4 w-4" />
            <span>
              {rateLimit.remaining} of {rateLimit.total} username changes remaining this month
              {rateLimit.isNewUser && ' (new user bonus)'}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {hasUsername ? 'Change Username' : 'Choose Username'}
          </label>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">@</span>
            </div>
            
            <input
              id="username"
              type="text"
              value={rawInput}
              onChange={handleInputChange}
              placeholder="skillseeker"
              maxLength={20}
              className={`
                block w-full pl-8 pr-10 py-2 border rounded-md
                ${validationError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : validation.isAvailable === true
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-1
              `}
              disabled={isSubmitting}
            />
            
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {getStatusIcon()}
            </div>
          </div>

          {/* Character count */}
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {sanitized.length}/20 characters
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className={`mt-2 text-sm flex items-center gap-2 ${
              validationError || validation.isAvailable === false
                ? 'text-red-600 dark:text-red-400'
                : validation.isAvailable === true
                ? 'text-green-600 dark:text-green-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {validationError || validation.isAvailable === false ? (
                <AlertCircle className="h-4 w-4" />
              ) : validation.isAvailable === true ? (
                <Check className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {statusMessage}
            </div>
          )}

          {/* Guidelines */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            • 3-20 characters • lowercase letters and numbers only
          </div>
        </div>

        {/* Preview */}
        {sanitized && isValid && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Preview:</div>
            <div className="font-mono text-lg text-gray-900 dark:text-gray-100">
              @{sanitized}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              ${canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
              transition-colors duration-200
            `}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Claiming...' : hasUsername ? 'Update Username' : 'Claim Username'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}