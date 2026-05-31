"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pb-6 px-4 pointer-events-none">
      <div className="bg-base-100 border-3 border-base-content shadow-neo rounded-2xl px-2 py-2 flex items-center gap-1 pointer-events-auto">
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
                // Neo-Brutalist FAB center button
                <div className="relative mx-1">
                  <motion.div
                    whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
                    className="w-14 h-14 rounded-xl bg-primary border-3 border-base-content flex items-center justify-center shadow-neo-sm transition-shadow duration-100"
                  >
                    <IconPlus size={30} className="text-base-content" stroke={3} />
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center justify-center w-14 h-14 gap-1 rounded-xl"
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 bg-base-content rounded-xl"
                      transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                    />
                  )}

                  <div className={`relative z-10 transition-colors duration-200 ${isActive ? "text-base-100" : "text-base-content"}`}>
                    <item.icon size={24} stroke={isActive ? 2.5 : 2} />
                  </div>

                  <span className={`relative z-10 text-[9px] font-black tracking-wide uppercase transition-colors duration-200 ${isActive ? "text-base-100" : "text-base-content"}`}>
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
