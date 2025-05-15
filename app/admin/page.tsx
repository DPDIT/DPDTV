"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface Folder {
  name: string;
  path: string;
  selected: boolean;
  subfolders?: Folder[];
}

const routes = [
  { id: "internal", name: "Internal Images" },
  { id: "external", name: "External Images" },
];

export default function AdminPage() {
  const [duration, setDuration] = useState(20);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [currentRoute, setCurrentRoute] = useState(routes[0].id);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: localStorage.getItem("adminPassword"),
        }),
      });

      if (!response.ok) {
        router.push("/admin/login");
      } else {
        fetchFolders();
        loadConfig();
        setLoading(false);
      }
    } catch (error) {
      router.push("/admin/login");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("adminPassword")) {
      fetchFolders();
      loadConfig();
    }
  }, [currentRoute]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/config?route=${currentRoute}`);
      const data = await response.json();
      setDuration(data.duration);
      setSelectedFolders(data.selectedFolders);
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolders(data.folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const handleFolderToggle = (path: string) => {
    setSelectedFolders((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleSave = async () => {
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration,
          selectedFolders,
          route: currentRoute,
        }),
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminPassword");
    router.push("/admin/login");
  };

  const renderFolderTree = (folder: Folder, level = 0) => {
    return (
      <div key={folder.path} style={{ marginLeft: `${level * 20}px` }}>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedFolders.includes(folder.path)}
            onChange={() => handleFolderToggle(folder.path)}
            className="form-checkbox"
          />
          <span>{folder.name}</span>
        </label>
        {folder.subfolders?.map((subfolder) =>
          renderFolderTree(subfolder, level + 1)
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006747]"></div>
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      )}
      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Settings</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white hover:bg-[#8B5B29] transition-colors bg-[#006747] rounded-lg"
            >
              Logout
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Route
            </label>
            <select
              value={currentRoute}
              onChange={(e) => setCurrentRoute(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Photo Duration (seconds)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              className="w-32 px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Select Folders</h2>
            <div className="border rounded p-4 max-h-96 overflow-y-auto">
              {folders.map((folder) => renderFolderTree(folder))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border rounded hover:bg-red-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#006747] text-white rounded hover:bg-[#8B5B29] transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
