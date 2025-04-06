// neuroforge/frontend/app/(auth)/signup/page.tsx
// Purpose: Signup page (conceptually similar to login for OAuth)
"use client"; // Required for onClick handlers

import { signIn } from "next-auth/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Github, Chrome } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {

  // Redirect to onboarding after first sign-up/sign-in
  const callbackUrl = "/onboarding";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-black p-4">
      <Card className="w-full max-w-md bg-gray-900/80 border-purple-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-purple-300">Initiate NeuroForge Protocol</CardTitle>
          <CardDescription className="text-gray-400">
            Begin your cognitive enhancement journey. Select your access vector.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signing in with a provider handles both login and signup */}
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-gray-600 hover:bg-gray-700"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <Chrome className="h-5 w-5" /> Authorize via Google
          </Button>
          <Button
             variant="outline"
             className="w-full justify-center gap-2 border-gray-600 hover:bg-gray-700"
            onClick={() => signIn("github", { callbackUrl })}
          >
            <Github className="h-5 w-5" /> Authorize via GitHub
          </Button>
          {/* Add other providers */}

           <p className="text-center text-sm text-gray-500">
             Already an operative?{' '}
             <Link href="/login" className="font-medium text-purple-400 hover:underline">
                Access Terminal (Log In)
             </Link>
           </p>
        </CardContent>
      </Card>
    </div>
  );
}