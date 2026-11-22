"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getFirebaseApp, getFirebaseAuth, getInitializationError } from "@/lib/firebase/client";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  providers: string[];
  isAdmin: boolean;
  role: string;
  permissions: string[];
}

function createFallbackProfile(firebaseUser: FirebaseUser): UserProfile {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    emailVerified: firebaseUser.emailVerified,
    providers: firebaseUser.providerData.map(p => p.providerId),
    isAdmin: false,
    role: "customer",
    permissions: [
      "orders:read:own",
      "orders:create",
      "cart:read",
      "cart:write",
      "wishlist:read",
      "wishlist:write",
      "reviews:create",
      "custom-requests:create",
      "profile:read",
      "profile:write",
      "addresses:read",
      "addresses:write",
    ],
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  configError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  waitForSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionResolve, setSessionResolve] = useState<() => void>(() => {});

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const response = await fetch(`/api/auth/profile?uid=${uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
        } else {
          console.warn("Profile API returned success but no profile data:", data);
        }
      } else {
        console.warn("Profile API returned non-ok status:", response.status);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  // Fallback profile creation from Firebase Auth user
  const setFallbackProfile = useCallback((firebaseUser: FirebaseUser) => {
    setProfile(createFallbackProfile(firebaseUser));
  }, []);

  useEffect(() => {
    // Check for Firebase initialization errors
    const initError = getInitializationError();
    if (initError) {
      setConfigError(initError.message);
      setLoading(false);
      setInitializing(false);
      return;
    }

    // Validate Firebase config
    if (!getFirebaseApp()) {
      setConfigError("Firebase not initialized. Check your environment variables.");
      setLoading(false);
      setInitializing(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      setFirebaseReady(true);

      let isFirstAuthState = true;

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("[AuthContext] Auth state changed:", firebaseUser?.uid ?? "null", "isFirst:", isFirstAuthState);
        
        setUser(firebaseUser);
        
        if (firebaseUser) {
          await fetchProfile(firebaseUser.uid);
          // Ensure profile is set even if API fails - use fallback
          if (!profile) {
            setFallbackProfile(firebaseUser);
          }

          // Get ID token and create session cookie
          try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            
            if (response.ok) {
              setSessionReady(true);
              setSessionResolve(() => {});
              console.log("[AuthContext] Session created successfully");
            } else {
              console.error("[AuthContext] Session creation failed:", await response.text());
            }
          } catch (err) {
            console.error("Failed to create session:", err);
          }
        } else {
          // Only clear session if this is NOT the initial auth state check
          if (!isFirstAuthState) {
            console.log("[AuthContext] User signed out, clearing session");
            setProfile(null);
            setSessionReady(false);
            setSessionResolve(() => {});
            try {
              await fetch("/api/auth/session", { method: "DELETE" });
            } catch (err) {
              console.error("Failed to clear session:", err);
            }
          } else {
            console.log("[AuthContext] Initial auth state check - user is null, not clearing session");
          }
        }
        
        if (isFirstAuthState) {
          isFirstAuthState = false;
          setInitializing(false);
        }
        
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Firebase initialization failed";
      setConfigError(message);
      setLoading(false);
      setInitializing(false);
    }
  }, [fetchProfile, setFallbackProfile, profile]);

  const waitForSession = useCallback(async () => {
    if (sessionReady) return;
    return new Promise<void>((resolve) => {
      setSessionResolve(() => resolve);
    });
  }, [sessionReady]);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName: string, phoneNumber?: string) => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      setError(message);
      throw err;
    }
  };

  const sendVerificationEmail = async () => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send verification email";
      setError(message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // Session creation and profile fetch handled by onAuthStateChanged
      // Caller should wait for session using waitForSession()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      throw err;
    }
  };

  const linkGoogleAccount = async () => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) throw new Error("Not authenticated");
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      await fetchProfile(auth.currentUser.uid);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to link Google account";
      setError(message);
      throw err;
    }
  };

  const updateProfileData = async (data: { displayName?: string; photoURL?: string }) => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) throw new Error("Not authenticated");
      await updateProfile(auth.currentUser, data);
      await fetchProfile(auth.currentUser.uid);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseReady) {
      throw new Error("Firebase not initialized");
    }
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser || !auth.currentUser.email) throw new Error("Not authenticated");
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      setError(message);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  // Render error UI if Firebase config is missing
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="w-12 h-12 text-destructive mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive mx-auto">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Firebase Configuration Missing</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              {configError}
            </p>
            <p className="text-xs text-muted-foreground">
              Create a .env.local file with your Firebase credentials. See .env.example for required variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      initializing,
      error,
      configError,
      login,
      register,
      logout,
      resetPassword,
      sendVerificationEmail,
      signInWithGoogle,
      linkGoogleAccount,
      updateProfile: updateProfileData,
      changePassword,
      clearError,
      refreshProfile,
      waitForSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}