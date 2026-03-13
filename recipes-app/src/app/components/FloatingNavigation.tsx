"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHome,
  IconUser,
  IconSearch,
  IconHeart,
  IconRobot,
  IconChefHat,
  IconCalendarEvent,
  IconPlus,
  IconFlame,
  IconDots,
} from "@tabler/icons-react";
import { useTheme } from "../contexts/ThemeContext";

export interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  action?: () => void;
  color?: string;
  bgColor?: string;
}

interface FloatingNavigationProps {
  router: any;
}

export const FloatingNavigation = ({ router }: FloatingNavigationProps) => {
  const { theme, themes } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isInteracting, setIsInteracting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current theme colors
  const currentTheme = themes.find((t) => t.name === theme) || themes[0];

  // Core navigation items that match hamburger menu
  const coreNavItems: NavItem[] = [
    {
      icon: IconHome,
      label: "Home",
      action: () => router.push("/"),
      color: "text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      icon: IconPlus,
      label: "Add Recipe",
      action: () => router.push("/recipes/add"),
      color: "text-orange-600",
      bgColor: "bg-orange-500",
    },
    {
      icon: IconHeart,
      label: "Favorites",
      action: () => router.push("/favorites"),
      color: "text-pink-600",
      bgColor: "bg-pink-500",
    },
    {
      icon: IconFlame,
      label: "Tinder",
      action: () => router.push("/tinder"),
      color: "text-red-600",
      bgColor: "bg-red-500",
    },
    {
      icon: IconRobot,
      label: "AI Recipes",
      action: () => router.push("/AI"),
      color: "text-indigo-600",
      bgColor: "bg-indigo-500",
    },
    {
      icon: IconCalendarEvent,
      label: "Daily Recipes",
      action: () => router.push("/daily-recipes"),
      color: "text-purple-600",
      bgColor: "bg-purple-500",
    },
  ];

  // Create infinite scrolling by repeating the nav items multiple times
  const navItems = [...coreNavItems, ...coreNavItems, ...coreNavItems];

  // Auto-close after 6 seconds of inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    if (!isInteracting) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 6000);
      setInactivityTimer(timer);
    }
  };

  // Handle scroll-based closing
  useEffect(() => {
    if (!isExpanded) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);

      // Close if scrolled more than 100px
      if (scrollDifference > 100) {
        setIsExpanded(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded, lastScrollY]);

  // Reset timer when expanded
  useEffect(() => {
    if (isExpanded) {
      resetInactivityTimer();
    } else {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    }

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [isExpanded, isInteracting]);

  const handleItemClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    }
    setIsExpanded(false);
  };

  const handleToggle = () => {
    setLastScrollY(window.scrollY);
    setIsExpanded(!isExpanded);
  };

  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    if (isExpanded) {
      resetInactivityTimer();
    }
  };

  return (
    <>
      {/* Expanded Navigation - Full width at bottom */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 w-full z-50 md:hidden"
          >
            <div
              className="px-4 py-4 shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: `${currentTheme.colors.background}f0`,
                borderTop: `1px solid ${currentTheme.colors.primary}30`,
              }}
            >
              {/* Horizontally Scrolling Navigation Items */}
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseEnter={handleInteractionStart}
                onMouseLeave={handleInteractionEnd}
              >
                {navItems.map((item, index) => (
                  <motion.button
                    key={`${item.label}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % coreNavItems.length) * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemClick(item)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-colors duration-200 group min-w-[70px]"
                    style={{
                      backgroundColor: `${currentTheme.colors.surface}`,
                      border: `1px solid ${currentTheme.colors.primary}20`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        currentTheme.colors.surface;
                    }}
                  >
                    <div
                      className={`${item.bgColor} rounded-full p-2 shadow-md transition-transform duration-200`}
                    >
                      <item.icon size={18} className="text-white" />
                    </div>
                    <span
                      className="text-xs font-medium text-center leading-tight"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Scroll Indicator */}
              <div className="flex justify-center mt-2">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-1.5 h-1.5 rounded-full opacity-50"
                      style={{
                        backgroundColor: currentTheme.colors.textSecondary,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button - Show only when not expanded */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 left-1/2 z-50 transform -translate-x-1/2 md:hidden"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggle}
              className="rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
              }}
            >
              <IconDots size={24} className="text-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
