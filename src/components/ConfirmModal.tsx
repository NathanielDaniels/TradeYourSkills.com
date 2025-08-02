"use client";
import React from "react";
import toast from "react-hot-toast";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showDefaultToast?: boolean; // control generic success toast
}

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  onConfirm,
  onCancel,
  showDefaultToast = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    if (showDefaultToast) {
      toast.success("Action confirmed!");
    }
  };

  const handleCancel = () => {
    onCancel();
    if (showDefaultToast) {
      toast("Action canceled", { icon: "⚪" });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="presentation"
      aria-hidden="false"
    >
      <dialog
        open={isOpen}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto transform animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        aria-modal="true"
      >
        <header className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
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
          <p
            id="confirm-modal-description"
            className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            {message}
          </p>
        </main>

        <footer className="flex flex-col sm:flex-row gap-3 sm:gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 shadow-lg hover:shadow-xl"
            aria-label="Confirm action"
          >
            Confirm
          </button>
        </footer>
      </dialog>
    </div>
  );
}
