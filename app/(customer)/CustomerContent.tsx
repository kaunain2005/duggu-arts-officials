"use client";
// src/app/(customer)/CustomerContent.tsx
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

function buildUserAreaHTML(
  user: ReturnType<typeof import("@/hooks/useAuth").useAuth>["user"],
  profile: ReturnType<typeof import("@/hooks/useAuth").useAuth>["profile"]
): string {
  const displayName = profile?.displayName || user?.displayName || "User";
  const email = profile?.email || user?.email || "";
  const photoURL = profile?.photoURL || user?.photoURL || null;
  const initial = (displayName || email || "U")[0].toUpperCase();

  return `
    <div class="flex items-center gap-3 px-3 py-2">
      ${photoURL
        ? `<img src="${photoURL}" alt="" class="w-8 h-8 rounded-full" loading="lazy" />`
        : `<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-primary font-medium">${initial}</span>
          </div>`
      }
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-foreground truncate">${displayName}</p>
        <p class="text-xs text-muted-foreground truncate">${email}</p>
      </div>
    </div>
  `;
}

function buildSkeletonHTML(): string {
  return `
    <div class="animate-pulse w-8 h-8 rounded-full bg-muted" aria-hidden="true" />
    <div class="flex-1 min-w-0">
      <div class="animate-pulse h-4 w-24 bg-muted rounded" />
      <div class="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
    </div>
  `;
}

export function CustomerContent({ children }: { children: ReactNode }) {
  const { user, profile, logout, loading } = useAuth();

  // Update the auth-dependent user area in the desktop sidebar
  useEffect(() => {
    const userArea = document.getElementById("auth-user-area");
    const logoutBtn = document.getElementById("auth-logout-btn");

    if (!userArea || !logoutBtn) return;

    if (loading) {
      userArea.innerHTML = buildSkeletonHTML();
      logoutBtn.classList.add("hidden");
      return;
    }

    if (!user) {
      userArea.innerHTML = buildSkeletonHTML();
      logoutBtn.classList.add("hidden");
      return;
    }

    // User is authenticated - render profile with Firebase Auth fallback
    userArea.innerHTML = buildUserAreaHTML(user, profile);
    logoutBtn.classList.remove("hidden");
  }, [loading, user, profile]);

  // Update the mobile auth user area
  useEffect(() => {
    const mobileUserArea = document.getElementById("mobile-auth-user-area");
    const mobileLogoutBtn = document.getElementById("mobile-auth-logout-btn");

    if (!mobileUserArea || !mobileLogoutBtn) return;

    if (loading) {
      mobileUserArea.innerHTML = `
        <div class="animate-pulse w-8 h-8 rounded-full bg-muted" aria-hidden="true" />
        <div class="flex-1 min-w-0">
          <div class="animate-pulse h-4 w-24 bg-muted rounded" />
          <div class="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
        </div>
      `;
      mobileLogoutBtn.classList.add("hidden");
      return;
    }

    if (!user) {
      mobileUserArea.innerHTML = `
        <div class="animate-pulse w-8 h-8 rounded-full bg-muted" aria-hidden="true" />
        <div class="flex-1 min-w-0">
          <div class="animate-pulse h-4 w-24 bg-muted rounded" />
          <div class="animate-pulse h-3 w-32 bg-muted rounded mt-1" />
        </div>
      `;
      mobileLogoutBtn.classList.add("hidden");
      return;
    }

    // User is authenticated - render profile with Firebase Auth fallback
    const displayName = profile?.displayName || user?.displayName || "User";
    const email = profile?.email || user?.email || "";
    const photoURL = profile?.photoURL || user?.photoURL || null;
    const initial = (displayName || email || "U")[0].toUpperCase();

    mobileUserArea.innerHTML = `
      <div class="flex items-center gap-3 px-3 py-2">
        ${photoURL
          ? `<img src="${photoURL}" alt="" class="w-8 h-8 rounded-full" loading="lazy" />`
          : `<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="text-primary font-medium">${initial}</span>
            </div>`
        }
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">${profile?.displayName || user?.displayName || "User"}</p>
          <p class="text-xs text-muted-foreground truncate">${user?.email}</p>
        </div>
      </div>
    `;
    mobileLogoutBtn.classList.remove("hidden");
  }, [loading, user, profile]);

  // Attach logout handlers
  useEffect(() => {
    const logoutBtn = document.getElementById("auth-logout-btn");
    const mobileLogoutBtn = document.getElementById("mobile-auth-logout-btn");

    if (logoutBtn) {
      logoutBtn.onclick = logout;
    }
    if (mobileLogoutBtn) {
      mobileLogoutBtn.onclick = logout;
    }
  }, [logout, loading, user]);

  // Render the content area based on auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading account">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="text-muted-foreground">Loading your account...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">Access your account dashboard, orders, and settings.</p>
          <Link
            href="/login?redirect=/account"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated content
  return <>{children}</>;
}