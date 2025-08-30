"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { UploadButton } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";

interface AvatarUploaderProps {
  avatarUrl: string;
  onUpload: (url: string) => Promise<void>;
}

export default function AvatarUploader({
  avatarUrl,
  onUpload,
}: AvatarUploaderProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const { update } = useSession();

  const handleUploadComplete = async (res: { key: string }[]) => {
    setProgress(null);
    try {
      const fileKey = res[0].key;
      const fullUrl = `https://utfs.io/f/${fileKey}`;
      await onUpload(fullUrl);
      const cacheBusted = `${fullUrl}?t=${Date.now()}`;
      await update({ image: cacheBusted });

      setFeedback({
        type: "success",
        message: "Avatar updated successfully!",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setFeedback({
        type: "error",
        message: "Failed to update avatar. Try again.",
      });
    } finally {
      setProgress(1);
      setTimeout(() => {
        setShowProgress(false);
        setProgress(null);
      }, 500);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleUploadError = (error: Error) => {
    setShowProgress(false);
    setProgress(null);
    setFeedback({
      type: "error",
      message: `Upload failed: ${error.message}`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };
  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="avatar-heading"
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2
            id="avatar-heading"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Profile Picture
          </h2>
        </div>
      </header>
      <AnimatePresence>
        {feedback && (
          <motion.p
            key="feedback"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg text-sm ${
              feedback.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {feedback.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 lg:w-32 lg:h-32">
          <Image
            src={avatarUrl}
            alt="Profile Avatar"
            fill
            sizes="(max-width: 1024px) 96px, 128px"
            className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-lg"
          />
        </div>
        <div>
          <UploadButton<OurFileRouter, "avatar">
            endpoint="avatar"
            appearance={{
              button:
                "flex justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-lg",
            }}
            content={{
              button({ isUploading }) {
                return isUploading ? "Uploading..." : "Change Avatar";
              },
            }}
            onUploadProgress={(p) => {
              setProgress(p);
              setShowProgress(true);
            }}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
          <AnimatePresence>
            {showProgress && progress !== null && (
              <motion.div
                key="progress"
                initial={{ opacity: 1 }}
                animate={{ opacity: progress === 1 ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-2 text-xs text-gray-500 space-y-1"
              >
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            JPG or PNG • Max 4MB
          </p>
        </div>
      </div>
    </section>
  );
}
