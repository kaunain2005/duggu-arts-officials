"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, applyActionCode } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const link = searchParams.get("link");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const code = oobCode || (link ? new URLSearchParams(new URL(link).search).get("oobCode") : null);
    if (!code) {
      setError("Invalid or missing verification code");
      setCodeValid(false);
    } else {
      setCodeValid(true);
    }
  }, [oobCode, link]);

  const handleVerify = async () => {
    const code = oobCode || (link ? new URLSearchParams(new URL(link).search).get("oobCode") : null);
    if (!code) return;

    setIsLoading(true);
    setError(null);

    try {
      await applyActionCode(auth, code);
      setSuccess(true);
      setVerified(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify email. The link may have expired or already been used.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (codeValid && !success && !verified && !isLoading) {
      handleVerify();
    }
  }, [codeValid, success, verified, isLoading]);

  if (!codeValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid verification link</h1>
            <p className="text-muted-foreground mb-6">
              This email verification link is invalid or has expired.
            </p>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold text-primary">Duggu Arts</span>
          </Link>
          {success || verified ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground">Email verified!</h1>
              <p className="text-muted-foreground mt-2">Your email has been successfully verified</p>
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl font-bold text-foreground">Verifying your email</h1>
              <p className="text-muted-foreground mt-2">Please wait...</p>
            </>
          ) : (
            <>
              <Mail className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground">Verification failed</h1>
              <p className="text-muted-foreground mt-2">Unable to verify your email</p>
            </>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          {(error && !success && !verified) && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {(success || verified) && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <Link href="/login?verified=true" className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors">
                Sign in
              </Link>
            </div>
          )}

          {!success && !verified && !isLoading && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                The verification link appears to be invalid or expired.
              </p>
              <button
                onClick={handleVerify}
                className="w-full py-2.5 border border-input bg-background rounded-lg font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
              <Link href="/login" className="block text-center text-primary hover:underline font-medium mt-4">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}