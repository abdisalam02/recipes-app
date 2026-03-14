import React from "react";
import { IconChefHat } from "@tabler/icons-react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col md:flex-row font-sans">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-64 bg-base-100 border-r border-base-300 h-screen sticky top-0 shadow-sm z-20 shrink-0">
        <div className="p-6">
          <div className="h-8 bg-base-300 rounded-lg w-2/3 animate-pulse" />
        </div>
        <div className="px-4 mt-4 space-y-3">
          <div className="h-12 bg-base-200 rounded-xl w-full animate-pulse" />
          <div className="h-12 bg-base-200 rounded-xl w-full animate-pulse" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 shrink flex flex-col min-w-0 min-h-screen relative pb-24 md:pb-8">
        <div className="md:hidden bg-base-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="h-6 bg-base-200 rounded-lg w-20 animate-pulse" />
          <div className="h-10 bg-base-200 rounded-xl w-32 animate-pulse" />
        </div>

        <div className="px-6 py-8 md:px-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-base-300 rounded-lg w-48 animate-pulse" />
            <div className="h-4 bg-base-300 rounded-md w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-base-300 rounded-xl w-32 animate-pulse self-start sm:self-auto" />
        </div>

        <div className="px-6 md:px-10 max-w-7xl mx-auto w-full flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-base-300 w-full flex items-center justify-center">
                   <IconChefHat size={40} className="text-base-content/30" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-base-300 rounded-md w-3/4" />
                  <div className="h-4 bg-base-300 rounded-md w-full" />
                  <div className="h-4 bg-base-300 rounded-md w-5/6" />
                  <div className="h-10 bg-base-300 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
