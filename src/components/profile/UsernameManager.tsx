// src/components/profile/UsernameManager.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import InputModal from "../InputModal";
// import UsernameClaimForm from "./UsernameClaimForm";
import { Edit2, Plus, User, AtSign } from "lucide-react";
import toast from "react-hot-toast";

export default function UsernameManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session, update } = useSession();

  const hasUsername = !!session?.user?.username;

  const handleUsernameSubmit = async (username: string) => {
    if (!username.trim()) return;

    // Prevent setting the same username
    if (username.trim().toLowerCase() === session?.user?.username) {
      toast.error("This is already your current username");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/profile/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update username");
      }

      const result = await response.json();

      // Update NextAuth session
      await update({ username: result.username });

      toast.success(`Username @${result.username} set successfully!`, {
        duration: 4000,
        position: "top-center",
      });

      setIsModalOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update username"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <aside
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="username-heading"
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
            <AtSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2
            id="username-heading"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Username
          </h2>
        </div>
      </header>

      <div className="mb-4">
        {hasUsername ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="font-mono text-lg text-gray-900 dark:text-gray-100">
                @{session?.user?.username}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No username set yet
          </div>
        )}
      </div>

      <footer>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-lg flex items-center justify-center gap-2"
        >
          {hasUsername ? (
            <>
              <Edit2 className="h-4 w-4" />
              Change Username
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Set Username
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          3-20 characters • lowercase letters and numbers only
        </p>
      </footer>

      <InputModal
        isOpen={isModalOpen}
        title={hasUsername ? "Change Username" : "Set Your Username"}
        message="Enter your desired username. It must be 3-20 characters long and contain only lowercase letters and numbers."
        placeholder="e.g., skillseeker"
        onConfirm={handleUsernameSubmit}
        onCancel={() => setIsModalOpen(false)}
        isSubmitting={isUpdating}
        submitText={hasUsername ? "Update Username" : "Set Username"}
        validationPattern="^[a-z0-9]{3,20}$"
        validationMessage="Username must be 3-20 characters, lowercase letters and numbers only"
      />
    </aside>
  );
}
