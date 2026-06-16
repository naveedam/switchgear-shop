// src/components/admin/AdminSidebar.tsx
// CHANGE: added "Buyer Outreach" nav link pointing to /admin/buyer-outreach

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  Upload,
  UserSearch,   // ← icon for Buyer Outreach
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",        to: "/admin",                    icon: <LayoutDashboard size={18} /> },
  { label: "Products",         to: "/admin/products",           icon: <Package          size={18} /> },
  { label: "Orders",           to: "/admin/orders",             icon: <ShoppingCart     size={18} /> },
  { label: "Sellers",          to: "/admin/sellers",            icon: <Users            size={18} /> },
  { label: "Catalog Ingestion",to: "/admin/catalog-ingestion",  icon: <Upload           size={18} /> },
  // ✅ NEW — Buyer Outreach CRM
  { label: "Buyer Outreach",   to: "/admin/buyer-outreach",     icon: <UserSearch       size={18} /> },
  { label: "Analytics",        to: "/admin/analytics",          icon: <BarChart2        size={18} /> },
  { label: "Settings",         to: "/admin/settings",           icon: <Settings         size={18} /> },
];

export default function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 min-h-screen flex flex-col py-6">
      {/* Logo / brand */}
      <div className="px-5 mb-8">
        <span className="font-bold text-lg tracking-tight text-white">
          SwitchgearShop
        </span>
        <span className="block text-xs text-gray-400 mt-0.5">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"} // exact match only for root dashboard
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 pt-4 border-t border-gray-700 text-xs text-gray-500">
        Rizq Labs © 2025
      </div>
    </aside>
  );
}
