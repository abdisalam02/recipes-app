"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IconHome, IconPlus, IconHeart, IconRobot, IconFlame } from "@tabler/icons-react";

const navItems = [
  { icon: IconHome,  label: "Home",      path: "/" },
  { icon: IconFlame, label: "Tinder",    path: "/tinder" },
  { icon: IconPlus,  label: "Add",       path: "/recipes/add" },
  { icon: IconHeart, label: "Favorites", path: "/favorites" },
  { icon: IconRobot, label: "AI",        path: "/AI" },
];

export const FloatingNavigation = ({ router }: { router?: any }) => {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pb-5 px-4 pointer-events-none">
      <div className="bg-base-100/95 backdrop-blur-2xl border border-base-300/80 shadow-[0_8px_40px_rgba(0,0,0,0.18)] rounded-[2rem] px-1.5 py-1.5 flex items-center gap-0.5 pointer-events-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname?.startsWith(item.path));

          // Center FAB-style Add button
          const isAdd = item.path === "/recipes/add";

          return (
            <Link
              key={item.label}
              href={item.path}
              prefetch={true}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="relative"
            >
              {isAdd ? (
                // FAB-style center button
                <div className="relative mx-1">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <IconPlus size={26} className="text-primary-content" stroke={2.5} />
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="relative flex flex-col items-center justify-center w-16 h-14 gap-0.5 rounded-2xl"
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}

                  <div className={`relative z-10 transition-colors duration-200 ${isActive ? "text-primary" : "text-base-content/40"}`}>
                    <item.icon size={22} stroke={isActive ? 2.5 : 2} />
                  </div>

                  <span className={`relative z-10 text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? "text-primary" : "text-base-content/40"}`}>
                    {item.label}
                  </span>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
