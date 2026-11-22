"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, User, Package, Heart, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/formatting";
import { CustomerContent } from "./CustomerContent";
import { ThemeSwitcher } from "@/components/theme-switcher";

const navigation = [
  { name: "Dashboard", href: "/account", icon: LayoutDashboard },
  { name: "Profile", href: "/account/profile", icon: User },
  { name: "Addresses", href: "/account/addresses", icon: Settings },
  { name: "Orders", href: "/account/orders", icon: Package },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Always render the exact same DOM structure for Instant Navigation
  // No conditional rendering that changes the component tree
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - ALWAYS rendered for Instant Navigation */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-30 bg-card border-r border-border flex flex-col">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-primary">Duggu Arts</Link>
            <p className="text-sm text-muted-foreground mt-1">My Account</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Account navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                  pathname === item.href && "bg-primary/10 text-primary"
                )}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer with Theme Switcher and User Area */}
          <div className="p-4 border-t border-border flex flex-col gap-4 flex-shrink-0">
            {/* Theme Switcher */}
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Theme
              </span>
              <ThemeSwitcher />
            </div>

            {/* Auth-dependent user area - rendered by CustomerContent */}
            <div id="auth-user-area" className="flex items-center gap-3 px-3 py-2 min-h-[80px]">
              <div className="animate-pulse w-8 h-8 rounded-full bg-muted" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="animate-pulse h-4 w-24 bg-muted rounded" />
                <div className="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
              </div>
            </div>

            {/* Logout Button - Always visible when authenticated */}
            <button
              id="auth-logout-btn"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors hidden"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-card border border-border shadow-lg"
        aria-label="Open menu"
        aria-expanded={false}
        aria-controls="mobile-sidebar"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-sidebar"
          className="fixed inset-0 z-40 md:hidden bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">My Account</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2" aria-label="Mobile account navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            {/* Mobile Theme Switcher */}
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Theme
                </span>
                <ThemeSwitcher />
              </div>
            </div>
            {/* Mobile User Area */}
            <div id="mobile-auth-user-area" className="px-4 py-2 border-t border-border min-h-[80px]">
              <div className="animate-pulse w-8 h-8 rounded-full bg-muted" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="animate-pulse h-4 w-24 bg-muted rounded" />
                <div className="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
              </div>
            </div>
            {/* Mobile Logout Button */}
            <button
              id="mobile-auth-logout-btn"
              className="w-full mx-4 mb-4 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors hidden"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content - ALWAYS rendered for Instant Navigation */}
      <main className="md:ml-64 min-h-screen pt-4 md:pt-0" id="main-content" role="main">
        <div className="p-4 md:p-8">
          {/* CustomerContent handles all auth-dependent rendering */}
          <CustomerContent>{children}</CustomerContent>
        </div>
      </main>
    </div>
  );
}