"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHome,
  IconHeart,
  IconRobot,
  IconCalendarEvent,
  IconPlus,
  IconFlame,
  IconDots,
} from "@tabler/icons-react";

interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  color: string;
}

const navItems: NavItem[] = [
  { icon: IconHome, label: "Home", path: "/", color: "bg-blue-500" },
  {
    icon: IconPlus,
    label: "Add Recipe",
    path: "/recipes/add",
    color: "bg-green-500",
  },
  {
    icon: IconHeart,
    label: "Favorites",
    path: "/favorites",
    color: "bg-red-500",
  },
  { icon: IconFlame, label: "Tinder", path: "/tinder", color: "bg-orange-500" },
  { icon: IconRobot, label: "AI Recipes", path: "/AI", color: "bg-purple-500" },
  {
    icon: IconCalendarEvent,
    label: "Daily",
    path: "/daily-recipes",
    color: "bg-indigo-500",
  },
];

export const OptimizedFloatingNav = () => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-close on scroll
  useEffect(() => {
    if (!isExpanded) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 50) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded, lastScrollY]);

  // Auto-close after 5 seconds
  useEffect(() => {
    if (!isExpanded) return;

    const timer = setTimeout(() => setIsExpanded(false), 5000);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setLastScrollY(window.scrollY);
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Expanded Navigation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-4 shadow-xl"
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors min-w-[70px]"
                >
                  <div className={`${item.color} rounded-full p-2 shadow-md`}>
                    <item.icon size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleExpanded}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <IconDots size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
