import { useLocation } from "wouter";
import { Home, Search, Building2, User, FileText, Grid3X3 } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Grid3X3, label: "Feed", path: "/feed" },
    { icon: FileText, label: "Requirements", path: "/requirements" },
    { icon: Building2, label: "Listings", path: "/my-listings" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white border-t border-neutral-200 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center py-2 px-4 touch-target ${
              location === item.path ? "text-primary" : "text-neutral-400"
            }`}
          >
            <item.icon size={20} className="mb-1" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
