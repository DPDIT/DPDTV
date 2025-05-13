"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useParams } from "next/navigation";

interface Config {
  duration: number;
  selectedFolders: string[];
}

export default function ImageCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<Config>({
    duration: 20,
    selectedFolders: [],
  });
  const params = useParams();
  const folder = params.folder as string;

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/config?route=${folder}`);
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }, [folder]);

  const loadImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/images?folder=${folder}`);
      const data = await response.json();
      setImages(data.images);

      if (emblaApi && data.images.length > 0) {
        const interval = setInterval(() => {
          emblaApi.scrollNext();
        }, config.duration * 1000); // Convert seconds to milliseconds

        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error("Error loading images:", error);
    }
  }, [folder, emblaApi, config.duration]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const progress =
        (emblaApi.selectedScrollSnap() / (emblaApi.slideNodes().length - 1)) *
        100;
      setProgress(progress);
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Check if the current folder is in the selected folders or if there are no images
  if (!config.selectedFolders.includes(folder) || images.length === 0) {
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
          {images.map((image, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative w-full h-full"
            >
              <Image
                src={`/images/${folder}/${image}`}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover bg-black"
                priority={index === 0}
              />
            </div>
          ))}
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
