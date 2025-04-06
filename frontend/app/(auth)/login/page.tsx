// neuroforge/frontend/app/(auth)/login/page.tsx
// Purpose: Login page using NextAuth providers
"use client"; // Required for onClick handlers

import { signIn } from "next-auth/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Github, Chrome } from "lucide-react"; // Example icons (use appropriate ones)
import Link from "next/link";

export default function LoginPage() {

  // Specify callbackUrl to redirect after successful login
  const callbackUrl = "/dashboard"; // Or '/onboarding' if needed

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-black p-4">
      <Card className="w-full max-w-md bg-gray-900/80 border-purple-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-purple-300">Access Terminal</CardTitle>
          <CardDescription className="text-gray-400">
            Authenticate via secure channels to access NeuroForge protocols.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-gray-600 hover:bg-gray-700"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <Chrome className="h-5 w-5" /> Continue with Google
          </Button>
          <Button
             variant="outline"
             className="w-full justify-center gap-2 border-gray-600 hover:bg-gray-700"
            onClick={() => signIn("github", { callbackUrl })}
          >
            <Github className="h-5 w-5" /> Continue with GitHub
          </Button>
          {/* Add buttons for Facebook, Twitter/X if configured */}

           <p className="text-center text-sm text-gray-500">
             New operative?{' '}
             <Link href="/signup" className="font-medium text-purple-400 hover:underline">
                Initiate uplink (Sign Up)
             </Link>
           </p>
        </CardContent>
      </Card>
    </div>
  );
}