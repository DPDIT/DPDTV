"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Main from "../components/Main";

export default function AdminPage() {
  const year = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(year);
  const [currentRoute, setCurrentRoute] = useState<string>("internal");
  const [selectedFolder, setSelectedFolder] = useState<string>(
    `${year}/internal`
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Update selectedFolder when route or year changes
  useEffect(() => {
    setSelectedFolder(`${selectedYear}/${currentRoute}`);
  }, [selectedYear, currentRoute]);

  // Auth check and initial load
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check", { method: "GET" });
      if (!response.ok) {
        router.push("/admin/login");
        return;
      }
      setLoading(false);
    } catch {
      router.push("/admin/login");
      return;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Logout redirect
  const handleLogout = () => {
    router.push("/admin/login");
  };

  const onUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;

    if (!fileInput?.files?.length) {
      alert("Please select a file to upload");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", `2025/${currentRoute}/${file.name}`);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Uploaded successfully: ${data.url}`);
    } else {
      alert("Upload failed");
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006747]" />
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        <Sidebar
          onFolderClick={(path) => setSelectedFolder(path)}
          setCurrentRoute={setCurrentRoute}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
        <div className="flex-1 overflow-auto">
          <Main selectedFolder={selectedFolder} currentRoute={currentRoute} />
        </div>
      </div>
    </>
  );
}
