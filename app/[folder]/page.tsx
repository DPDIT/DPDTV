"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useParams } from "next/navigation";

interface Config {
  duration: number;
  selectedFolders: string[];
}

// Utility functions
const normalizePath = (path: string): string => path.replace(/\\/g, "/");
const isVideoFile = (filename: string): boolean =>
  /\.(mp4|webm|mov|avi|mkv)$/i.test(filename);

export default function ImageCarousel() {
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<Config>({
    duration: 20,
    selectedFolders: [],
  });
  const [originalDuration, setOriginalDuration] = useState(20);
  const params = useParams();
  const folder = params.folder as string;

  const loadConfig = useCallback(async () => {
    try {
      console.log("Loading config for folder:", folder);
      const response = await fetch(`/api/config?route=${folder}`);
      const data = await response.json();
      console.log("Received config data:", data);
      setConfig(data);
      setOriginalDuration(data.duration);
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }, [folder]);

  const loadImages = useCallback(async () => {
    try {
      console.log("Loading images for folder:", folder);
      const response = await fetch(`/api/images?folder=${folder}`);
      const data = await response.json();
      console.log("Received images data:", data);
      setImages(data.images);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  }, [folder]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadConfig();
      await loadImages();
      setIsLoading(false);
    };
    initialize();
  }, [folder, loadConfig, loadImages]);

  useEffect(() => {
    if (!emblaApi || images.length === 0) return;

    let interval: NodeJS.Timeout;

    const startInterval = () => {
      if (interval) {
        clearInterval(interval);
      }
      console.log("Setting interval with duration:", config.duration);
      interval = setInterval(() => {
        emblaApi.scrollNext();
      }, config.duration * 1000);
    };

    startInterval();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [emblaApi, images.length, config.duration]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const currentIndex = emblaApi.selectedScrollSnap();
      const currentImage = images[currentIndex];
      const isVideo = currentImage && isVideoFile(currentImage);

      if (isVideo) {
        const videoElement = emblaApi
          .slideNodes()
          [currentIndex].querySelector("video");
        if (videoElement) {
          console.log("Video duration:", videoElement.duration);
          setConfig((prev) => ({
            ...prev,
            duration: videoElement.duration,
          }));
        }
      } else {
        setConfig((prev) => ({ ...prev, duration: originalDuration }));
      }

      const progress =
        (currentIndex / (emblaApi.slideNodes().length - 1)) * 100;
      setProgress(progress);
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, images, originalDuration]);

  const isFolderEnabled = config.selectedFolders.some(
    (f) => normalizePath(f) === normalizePath(`2025/${folder}`)
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006747]"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isFolderEnabled || images.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <h1 className="text-2xl">
          This folder is not enabled in the admin settings.
        </h1>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      <div className="relative w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full">
          {images.map((image, index) => {
            const isVideo = isVideoFile(image);
            return (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 relative w-full h-full"
              >
                {isVideo ? (
                  <video
                    src={`/images/${image}`}
                    className="w-full h-full object-cover bg-black"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      setConfig((prev) => ({
                        ...prev,
                        duration: video.duration,
                      }));
                    }}
                    onEnded={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.pause();
                      setConfig((prev) => ({
                        ...prev,
                        duration: originalDuration,
                      }));
                    }}
                  />
                ) : (
                  <Image
                    src={`/images/${image}`}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-cover bg-black"
                    priority={index === 0}
                    quality={100}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="100vw"
                    onLoad={() => {
                      setConfig((prev) => ({
                        ...prev,
                        duration: originalDuration,
                      }));
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800/30">
        <div
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
