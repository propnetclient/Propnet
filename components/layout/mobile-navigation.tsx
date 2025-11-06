"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, MessageCircle, Map, Users } from "lucide-react";

export default function MobileNavigation() {
  const pathname = usePathname();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Search, label: "Feed", path: "/properties/feed" },
    { icon: Map, label: "Map", path: "/map" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Users, label: "Clients", path: "/clients" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white dark:bg-gray-900 border-t border-neutral-200 dark:border-gray-700 z-30">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center py-2 px-4 touch-target transition-colors ${
              pathname === tab.path 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon size={20} className="mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}