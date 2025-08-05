"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadButton } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core";
// import ProgressBar from "@/components/ui/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";

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

  const handleUploadComplete = async (res: { key: string }[]) => {
    setProgress(null);
    try {
      const fileKey = res[0].key;
      const fullUrl = `https://utfs.io/f/${fileKey}`;
      await onUpload(fullUrl);
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
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex align-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 mr-4">
          Profile Picture
        </h2>
        <AnimatePresence>
          {feedback && (
            <motion.p
              key="feedback"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className={`text-sm mb-3 ${
                feedback.type === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {feedback.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <Image
            src={avatarUrl}
            alt="Profile Avatar"
            fill
            sizes="80px"
            className="rounded-full object-cover border border-gray-300"
          />
        </div>
        <div>
          <UploadButton<OurFileRouter, "avatar">
            endpoint="avatar"
            appearance={{
              button:
                "w-[120px] h-[36px] flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed",
            }}
            content={{
              button({ isUploading }) {
                return isUploading ? "Uploading..." : "Upload Avatar";
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
                className="mt-2 text-xs text-gray-500"
              >
                Uploading: {Math.round(progress)}%
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 4MB</p>
        </div>
      </div>
    </section>
  );
}
