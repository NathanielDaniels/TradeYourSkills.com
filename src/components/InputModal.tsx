"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface InputModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  error?: string;
}

export default function InputModal({
  isOpen,
  title,
  message,
  placeholder = "Enter value...",
  onConfirm,
  onCancel,
  error,
}: InputModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Clear input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleConfirm();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm(inputValue);
    if (!error) setInputValue(""); // Clear only if no error
  };

  const handleCancel = () => {
    onCancel();
    toast("Action canceled", { icon: "⚪" });
    setInputValue("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="presentation"
      aria-hidden="false"
    >
      <dialog
        open={isOpen}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="input-modal-title"
        aria-describedby="input-modal-description"
        aria-modal="true"
      >
        <header className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-modal="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </header>

        <main className="text-center mb-6">
          <h2
            id="confirm-modal-title"
            className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          {message && (
            <p
              id="confirm-modal-description"
              className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4"
            >
              {message}
            </p>
          )}
        </main>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          className="mb-6"
        >
          <fieldset className="mb-6">
            <legend className="sr-only">Enter skill information</legend>
            <label htmlFor="skill-input" className="sr-only">
              Skill name
            </label>
            <input
              id="skill-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              autoFocus
              required
              aria-describedby="input-help"
              className={`w-full mt-4 px-4 py-2 rounded-lg border ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              } dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
            />
          </fieldset>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
              aria-label="Cancel adding skill"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 shadow-lg hover:shadow-xl disabled:shadow-none"
              aria-label="Add new skill"
            >
              Add Skill
            </button>
          </div>
        </form>

        {/* Keyboard hint */}
        <aside id="input-help" className="mt-3 text-center" aria-live="polite">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
              Enter
            </kbd>{" "}
            to confirm or{" "}
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
              Esc
            </kbd>{" "}
            to cancel
          </p>
        </aside>
      </dialog>
    </div>
  );
}
