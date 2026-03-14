import React from "react";
import { IconChefHat } from "@tabler/icons-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col font-sans">
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:px-10 flex flex-col pt-24 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-3xl bg-base-300 animate-pulse flex items-center justify-center">
             <IconChefHat size={32} className="text-base-content/30" />
          </div>
          <div className="space-y-3 flex-1 max-w-sm">
             <div className="h-8 bg-base-300 rounded-lg w-3/4 animate-pulse" />
             <div className="h-4 bg-base-300 rounded-md w-1/2 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-base-300 w-full" />
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
    </div>
  );
}
