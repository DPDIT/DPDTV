"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useParams } from "next/navigation";

interface Config {
  duration: number;
  selectedFolders: string[];
}

interface ImageData {
  id: string;
  url: string;
  name: string;
}

export default function ImageCarousel() {
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [images, setImages] = useState<ImageData[]>([]);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<Config>({
    duration: 20,
    selectedFolders: [],
  });
  const params = useParams();
  const route = params.folder as string;

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/config?route=${route}`);
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }, [route]);

  const loadImages = useCallback(async () => {
    if (!config.selectedFolders.length) return;

    try {
      const imagePromises = config.selectedFolders.map((folderPath) =>
        fetch(`/api/images?folder=${encodeURIComponent(folderPath)}`)
          .then((res) => res.json())
          .then((data) => data.images || [])
      );

      const imageArrays = await Promise.all(imagePromises);
      const allImages = imageArrays.flat();
      setImages(allImages);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  }, [config.selectedFolders]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadConfig();
      setIsLoading(false);
    };
    initialize();
  }, [loadConfig]);

  useEffect(() => {
    if (config.selectedFolders.length > 0) {
      setIsLoading(true);
      loadImages().finally(() => {
        setIsLoading(false);
      });
    }
  }, [config.selectedFolders, loadImages]);

  useEffect(() => {
    if (!emblaApi || images.length === 0) return;

    let interval: NodeJS.Timeout;

    const startInterval = () => {
      if (interval) {
        clearInterval(interval);
      }
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
      const progress =
        (currentIndex / (emblaApi.slideNodes().length - 1)) * 100;
      setProgress(progress);
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, images]);

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

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <h1 className="text-2xl">
          No images available. Contact Administrator.
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
              key={image.id}
              className="flex-[0_0_100%] min-w-0 relative w-full h-full"
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover bg-black"
                priority={index === 0}
                quality={100}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="100vw"
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
