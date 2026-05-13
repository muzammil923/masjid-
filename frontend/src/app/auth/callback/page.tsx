"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=2592000; SameSite=Lax`;
}

function CallbackContent() {
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    if (!code) {
      setError("No authorization code received.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    handleCallback(code);
  }, [searchParams]);

  const handleCallback = async (code: string) => {
    try {
      const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        console.error("Supabase exchangeCodeForSession error:", error);
        throw new Error(error?.message || "Failed to complete authentication");
      }

      localStorage.setItem("auth_token", data.session.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_session", JSON.stringify(data.session));
      setCookie("auth_token", data.session.access_token);
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete authentication";
      console.error("Auth callback error:", msg);
      setError(msg);
      setTimeout(() => router.push("/login"), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        {error ? (
          <>
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-900 mb-2">Authentication Failed</h2>
            <p className="text-green-600">{error}</p>
            <p className="text-green-500 text-sm mt-4">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 size={48} className="text-green-700 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-green-900 mb-2">Completing Sign In</h2>
            <p className="text-green-600">Please wait while we verify your Google account...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
        <Loader2 size={48} className="text-green-700 mx-auto animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
