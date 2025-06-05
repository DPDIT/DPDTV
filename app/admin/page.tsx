"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Main from "../components/Main";

export default function AdminPage() {
  const year = new Date().getFullYear().toString();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[new Date().getMonth()];
  const [selectedYear, setSelectedYear] = useState<string>(year);
  const [currentRoute, setCurrentRoute] = useState<string>("internal");
  const [selectedFolder, setSelectedFolder] = useState<string>(
    `${year}/internal/${month}`
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
          setCurrentRoute={(route) => {
            setCurrentRoute(route);
            // Update selectedFolder to match new route
            const currentMonth = selectedFolder.split("/").pop() || "";
            setSelectedFolder(`${selectedYear}/${route}/${currentMonth}`);
          }}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedFolder={selectedFolder}
        />
        <div className="flex-1 overflow-auto">
          <Main selectedFolder={selectedFolder} currentRoute={currentRoute} />
        </div>
      </div>
    </>
  );
}
