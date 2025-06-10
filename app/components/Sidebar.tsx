"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Folder {
  name: string;
  path: string;
  subfolders?: Folder[];
}

interface SidebarProps {
  onFolderClick?: (path: string) => void;
  setCurrentRoute: (route: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedFolder: string;
}

export default function Sidebar({
  onFolderClick,
  setCurrentRoute,
  selectedYear,
  setSelectedYear,
  selectedFolder,
}: SidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [route, setRoute] = useState("internal");
  const [enabledFolders, setEnabledFolders] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear().toString();
  const years = Array.from({ length: 5 }, (_, i) =>
    (parseInt(currentYear) + i).toString()
  );

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch(
          `/api/folders?route=${route}&year=${selectedYear}`
        );
        const data = await res.json();
        setFolders(data.folders || []);
        // Expand all folders by default
        const allPaths = new Set<string>();
        const addPaths = (folders: Folder[]) => {
          folders.forEach((folder) => {
            if (folder.subfolders?.length) {
              allPaths.add(folder.path);
              addPaths(folder.subfolders);
            }
          });
        };
        addPaths(data.folders || []);
        setExpanded(allPaths);
      } catch (err) {
        console.error("Failed to fetch folders", err);
      }
    };

    fetchFolders();
  }, [route, selectedYear]);

  useEffect(() => {
    setCurrentRoute(route);
  }, [route, setCurrentRoute]);

  useEffect(() => {
    // Fetch enabled folders configuration
    fetch(`/api/config?route=${route}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch config");
        return res.json();
      })
      .then((data) => {
        setEnabledFolders(new Set(data.selectedFolders || []));
      })
      .catch((err) => {
        console.error("Failed to fetch config:", err);
      });
  }, [route]);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const copy = new Set(prev);
      copy.has(path) ? copy.delete(path) : copy.add(path);
      return copy;
    });
  };

  const toggleFolder = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder expansion when clicking toggle
    const newEnabledFolders = new Set(enabledFolders);
    if (newEnabledFolders.has(path)) {
      newEnabledFolders.delete(path);
    } else {
      newEnabledFolders.add(path);
    }
    setEnabledFolders(newEnabledFolders);

    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          selectedFolders: Array.from(newEnabledFolders),
        }),
      });
    } catch (err) {
      console.error("Failed to save config:", err);
      // Revert the change if save failed
      setEnabledFolders(enabledFolders);
    }
  };

  const renderFolderTree = (folder: Folder, depth = 0) => (
    <div key={folder.path}>
      <div
        onClick={() => {
          toggleExpand(folder.path);
          if (!folder.subfolders?.length) {
            onFolderClick?.(folder.path);
          }
        }}
        className={`cursor-pointer p-1 hover:bg-gray-100 rounded flex items-center justify-between group ${
          selectedFolder === folder.path
            ? "bg-[#006747] text-white hover:bg-[#006747]"
            : ""
        }`}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center">
          {folder.subfolders?.length ? (
            <span className="mr-1">
              {expanded.has(folder.path) ? "▼" : "▶"}
            </span>
          ) : (
            <span className="mr-4" />
          )}
          <span>{folder.name}</span>
        </div>
        {!folder.subfolders?.length && (
          <div
            onClick={(e) => toggleFolder(folder.path, e)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enabledFolders.has(folder.path) ? "bg-green-500" : "bg-gray-300"
            } cursor-pointer`}
            title={
              enabledFolders.has(folder.path)
                ? "Disable folder"
                : "Enable folder"
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabledFolders.has(folder.path)
                  ? "translate-x-4"
                  : "translate-x-1"
              }`}
            />
          </div>
        )}
      </div>
      {expanded.has(folder.path) &&
        folder.subfolders?.map((sub) => renderFolderTree(sub, depth + 1))}
    </div>
  );

  return (
    <aside className="w-64 bg-white border-r h-screen p-4 overflow-y-auto">
      <div className="flex justify-left items-center mx-auto mb-2">
        <Link href={"/"}>
          <Image
            src="/logo/DPDTV.png"
            alt="DPD TV Logo"
            width={150}
            height={100}
            className="object-contain"
          />
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 flex-col">
          <div className="flex-1">
            <label htmlFor="route" className="block text-sm font-medium mb-1">
              Select Media Route
            </label>
            <select
              id="route"
              value={route}
              onChange={(e) => {
                setRoute(e.target.value);
              }}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="internal">Internal</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="year" className="block text-sm font-medium mb-1">
              Select Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {folders.length === 0 ? (
        <p className="text-sm text-gray-500">No folders available</p>
      ) : (
        folders.map((folder) => renderFolderTree(folder))
      )}
    </aside>
  );
}
