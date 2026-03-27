import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, FileText, AlertTriangle, PiggyBank,
  Gift, CreditCard, Headphones, User, Menu, X, LogOut, Bell, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatbotWidget from "@/components/ChatbotWidget";

const navItems = [
  { title: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
  { title: "Mes contrats", path: "/dashboard/contracts", icon: FileText },
  { title: "Sinistres", path: "/dashboard/claims", icon: AlertTriangle },
  { title: "Épargne", path: "/dashboard/savings", icon: PiggyBank },
  { title: "Offres", path: "/dashboard/offers", icon: Gift },
  { title: "Paiements", path: "/dashboard/payments", icon: CreditCard },
  { title: "Support", path: "/dashboard/support", icon: Headphones },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-0 lg:w-16"
      } bg-sidebar overflow-hidden`}>
        <div className="flex items-center gap-2 h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {sidebarOpen && <span className="font-display font-bold text-sidebar-foreground whitespace-nowrap">ClaimSphere</span>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              {sidebarOpen ? <X className="w-5 h-5 lg:hidden" /> : <Menu className="w-5 h-5" />}
              <Menu className="w-5 h-5 hidden lg:block" />
            </button>
            <h1 className="font-display font-semibold text-foreground text-lg">
              {navItems.find((n) => n.path === location.pathname)?.title || "Tableau de bord"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center rounded-full font-bold">3</span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">Ahmed B.</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
