"use client";

import { useState, useEffect } from "react";
import Upload from "./Upload";
import Notice from "./Notice";

interface Image {
  id: string;
  url: string;
  name: string;
  scheduledAt?: string;
  expiresAt?: string | null;
}

interface MainProps {
  selectedFolder: string | null;
  currentRoute: string;
}

export default function Main({ selectedFolder, currentRoute }: MainProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const fetchImages = async () => {
    if (!selectedFolder) {
      setImages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/images?folder=${encodeURIComponent(selectedFolder)}&all=true`
      );
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading images");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    setDeletingImage(imageUrl);
    try {
      const res = await fetch(
        `/api/images?url=${encodeURIComponent(imageUrl)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete image");

      // Remove the image from the state
      setImages(images.filter((img) => img.url !== imageUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting image");
    } finally {
      setDeletingImage(null);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [selectedFolder]);

  if (!selectedFolder) {
    return <p className="p-4 text-gray-500">Select a folder to see images</p>;
  }

  if (loading) {
    return <p className="p-4 text-white">Loading images...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-500">Error: {error}</p>;
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Notice
          selectedFolder={selectedFolder.split("/").pop()}
          currentRoute={currentRoute}
        />
        <Upload
          selectedFolder={selectedFolder}
          onUploadComplete={fetchImages}
        />
      </div>
    );
  }

  const isExpired = (date: string | null | undefined) => {
    if (!date) return false;
    const expireDate = new Date(date);
    if (isNaN(expireDate.getTime())) return false;
    return expireDate < new Date();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between my-2">
        <h1 className="text-2xl text-white font-black">
          {selectedFolder.split("/").pop()}
        </h1>
        <Upload
          selectedFolder={selectedFolder.split("/").pop() || null}
          onUploadComplete={fetchImages}
        />
        {currentRoute == "public" && <Notice currentRoute={currentRoute} />}
      </div>

      <div className="grid grid-cols-3 gap-4 overflow-auto">
        {images.map(({ id, url, name, scheduledAt, expiresAt }) => (
          <div
            key={id}
            className="border rounded overflow-hidden relative group flex flex-col bg-gray-50"
          >
            <div className="flex-1 relative">
              <img
                src={url}
                alt={name}
                className="w-full h-full object-cover p-2"
              />
              <button
                onClick={() => handleDelete(url)}
                disabled={deletingImage === url}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete image"
              >
                {deletingImage === url ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="p-1 text-sm font-semibold truncate">
              <h1>{name}</h1>
              <h2>
                Display Start Date:{" "}
                {scheduledAt ? new Date(scheduledAt).toLocaleString() : "-"}
              </h2>
              <h2
                className={
                  isExpired(expiresAt) ? "text-red-500" : "text-green-500"
                }
              >
                Display Stop Date:{" "}
                {expiresAt ? new Date(expiresAt).toLocaleString() : "-"}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
