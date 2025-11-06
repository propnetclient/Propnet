"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, MessageCircle, Map, User } from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Search, label: "Feed", path: "/properties/feed" },
    { icon: Map, label: "Map", path: "/map" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white border-t border-neutral-200 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-2 px-4 touch-target ${
              pathname === item.path ? "text-primary" : "text-neutral-400"
            }`}
          >
            <item.icon size={20} className="mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
