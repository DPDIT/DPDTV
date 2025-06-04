"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Modal from "./Modal";

interface UploadProps {
  selectedFolder: string | null;
  onUploadComplete?: () => void;
}

export default function Upload({
  selectedFolder,
  onUploadComplete,
}: UploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedFolder) {
        setError("Please select a folder first");
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("path", `${selectedFolder}/${file.name}`);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          setUploadProgress((prev) => prev + 100 / acceptedFiles.length);
        }

        onUploadComplete?.();
        setIsModalOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFolder, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
  });

  const handleClose = () => {
    if (!isUploading) {
      setIsModalOpen(false);
      setError(null);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 my-2 bg-[#006747] text-white rounded-lg hover:bg-[#8B5B29] transition-colors duration-200 shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Upload New Images
      </button>

      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-[#006747] bg-[#006747]/10"
                : "border-gray-300 hover:border-[#006747]"
            }
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="text-gray-600">
              {isDragActive ? (
                <p>Drop the images here...</p>
              ) : (
                <p>Drag & drop images here, or click to select files</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Supports PNG, JPG, GIF, and WEBP images
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#006747] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </Modal>
    </>
  );
}
