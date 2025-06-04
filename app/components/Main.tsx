"use client";

import { useState, useEffect } from "react";
import Upload from "./Upload";

interface Image {
  id: string;
  url: string;
  name: string;
}

interface MainProps {
  selectedFolder: string | null;
  currentRoute: string;
}

export default function Main({ selectedFolder, currentRoute }: MainProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    if (!selectedFolder) {
      setImages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/images?folder=${encodeURIComponent(selectedFolder)}`
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
        <h1 className="text-4xl text-white py-2">
          No images found in {selectedFolder}.
        </h1>
        <Upload
          selectedFolder={selectedFolder}
          onUploadComplete={fetchImages}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl text-white mb-2">{selectedFolder}</h1>
      <Upload selectedFolder={selectedFolder} onUploadComplete={fetchImages} />
      <div className="grid grid-cols-3 gap-4 overflow-auto max-h-screen">
        {images.map(({ id, url, name }) => (
          <div
            key={id}
            className="border rounded overflow-hidden relative group flex flex-col"
          >
            <div className="flex-1 relative bg-gray-100">
              <img
                src={url}
                alt={name}
                className="w-full h-full object-cover p-2"
              />
            </div>
            <div className="p-1 text-sm text-center truncate bg-white">
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
