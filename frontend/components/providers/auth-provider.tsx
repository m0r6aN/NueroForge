// neuroforge/frontend/components/providers/auth-provider.tsx
// Purpose: Provides NextAuth session context to the app
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  // session?: Session | null; // Not needed if SessionProvider fetches itself
}

export function AuthProvider({ children }: AuthProviderProps) {
  // SessionProvider automatically handles fetching/updating the session
  return <SessionProvider>{children}</SessionProvider>;
}