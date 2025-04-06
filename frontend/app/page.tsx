// neuroforge/frontend/app/page.tsx
// Purpose: Landing/Home page (Publicly accessible)
import React from "react";
import { Button } from "components/ui/button"; // Shadcn Button
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="text-center space-y-6">
        {/* Placeholder for Neon Brain Logo */}
         <div className="w-24 h-24 bg-purple-500 rounded-full mx-auto animate-pulse"></div>

        <h1 className="text-5xl font-bold tracking-tighter text-purple-300">
          NeuroForge
        </h1>
        <p className="text-xl text-gray-300 max-w-xl mx-auto">
          Unlock classified learning protocols. Access the Area 51 of education and forge an elite mind.
        </p>
        <div className="space-x-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/signup">Initiate Protocol (Sign Up)</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-purple-400 text-purple-300 hover:bg-purple-900/50 hover:text-white">
            <Link href="/login">Access Terminal (Log In)</Link>
          </Button>
        </div>
         <p className="text-sm text-gray-500 pt-8">
            Highly Classified Cognitive Enhancement Program
         </p>
      </div>
    </main>
  );
}