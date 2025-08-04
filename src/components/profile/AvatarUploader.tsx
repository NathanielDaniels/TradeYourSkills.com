"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadButton } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core";
import ProgressBar from "@/components/ui/ProgressBar";

interface AvatarUploaderProps {
  avatarUrl: string;
  onUpload: (url: string) => Promise<void>;
}

export default function AvatarUploader({
  avatarUrl,
  onUpload,
}: AvatarUploaderProps) {
  const [progress, setProgress] = useState<number | null>(null);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Profile Picture
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <Image
            src={avatarUrl}
            alt="Profile Avatar"
            fill
            className="rounded-full object-cover border border-gray-300"
          />
        </div>
        <div>
          <UploadButton<OurFileRouter, "avatar">
            endpoint="avatar"
            appearance={{
              button:
                "px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700",
              container: "",
            }}
            onUploadProgress={(p) => setProgress(p)}
            onClientUploadComplete={async (res) => {
              setProgress(null);
              const fileKey = res[0].key;
              const fullUrl = `https://utfs.io/f/${fileKey}`;
              await onUpload(fullUrl);
            }}
            onUploadError={(error) => {
              setProgress(null);
            }}
          />
          {progress !== null && (
            <div className="mt-2 text-xs text-gray-500">
              Uploading: {Math.round(progress * 100)}%
              <ProgressBar progress={progress} />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 4MB</p>
        </div>
      </div>
    </section>
  );
}
