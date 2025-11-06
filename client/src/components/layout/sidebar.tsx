import { useLocation } from "wouter";
import { Building2, Home, Search, Map, MessageCircle, Users, Plus, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

export default function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const [location, setLocation] = useLocation();

  const items = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Search, label: "Feed", path: "/feed" },
    { icon: Map, label: "Map", path: "/map" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Users, label: "Clients", path: "/clients" },
  ];

  const containerWidthClass = collapsed ? 'w-20 items-center' : 'w-72';

  // Handler for clicking anywhere in the sidebar whitespace to expand if collapsed
  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement | HTMLDivElement>) => {
    // Only expand if collapsed and not clicking the collapse button
    if (collapsed && onToggle) {
      // Prevent toggling if the click is on the collapse button
      const target = e.target as HTMLElement;
      if (target.closest('.sidebar-toggle-btn')) return;
      onToggle();
    }
  };

  return (
    // Visible on md and up. Fixed to left side. Collapsible.
    <aside
      className={`hidden md:flex flex-col fixed top-0 left-0 h-full ${containerWidthClass} p-3 md:p-6 bg-white border-r border-neutral-200 z-40 cursor-pointer`}
      onClick={handleSidebarClick}
      aria-label="Sidebar"
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-4 px-1 relative w-full`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
          <Building2 className="w-7 h-7 text-blue-600" />
          {!collapsed && (
            <div>
              <div className="text-lg font-bold text-neutral-900">PropNet</div>
              <div className="text-xs text-neutral-500">Beta</div>
            </div>
          )}
        </div>
        {/* Show collapse button only when expanded */}
        {!collapsed && (
          <button
            onClick={e => { e.stopPropagation(); onToggle && onToggle(); }}
            className="sidebar-toggle-btn p-2 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className={`flex-1 ${collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1 px-1'}`}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex items-center ${collapsed ? 'justify-center w-12 h-12 my-1 rounded-xl' : 'w-full gap-3 text-left px-2 py-2 rounded-md'} hover:bg-neutral-100 transition-colors relative ${
              location === item.path ? 'bg-blue-50 text-blue-600 font-medium' : 'text-neutral-700'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={collapsed ? 24 : 18} />
            <span className={`${collapsed ? 'hidden' : 'text-sm'}`}>{item.label}</span>
            {collapsed && location === item.path && (
              <span className="absolute left-0 top-0 w-full h-full rounded-xl border-2 border-blue-500 pointer-events-none" />
            )}
          </button>
        ))}
      </nav>

      <div className={`mt-4 ${collapsed ? 'flex flex-col items-center gap-2' : 'px-1 grid grid-cols-2 gap-2'}`}>
        <button onClick={() => setLocation('/quickpost')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm ${collapsed ? 'w-12 h-12 rounded-xl' : ''}`} title={collapsed ? 'QuickPost' : undefined}>
          <Zap size={14} />
          {!collapsed && <span>QuickPost</span>}
        </button>
        <button onClick={() => setLocation('/add-property')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white text-sm ${collapsed ? 'w-12 h-12 rounded-xl' : ''}`} title={collapsed ? 'Add Property' : undefined}>
          <Plus size={14} />
          {!collapsed && <span>Add</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-6 text-xs text-neutral-500 px-1">
          <p>© 2025 PropNet</p>
        </div>
      )}
    </aside>
  );
}
