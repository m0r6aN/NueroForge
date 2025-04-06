// neuroforge/frontend/lib/auth.ts
// Purpose: NextAuth configuration

import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { AuthOptions } from "next-auth";
// Import other providers (Facebook, Twitter/X)
// import FacebookProvider from "next-auth/providers/facebook";
// import TwitterProvider from "next-auth/providers/twitter";

// If using Prisma or another DB adapter with NextAuth:
// import { PrismaAdapter } from "@auth/prisma-adapter"
// import prisma from "./prisma" // Your prisma client instance

export const authOptions: AuthOptions = {
  // adapter: PrismaAdapter(prisma), // Uncomment if using Prisma adapter
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // FacebookProvider({ ... }),
    // TwitterProvider({ ... }), // Note: X API changes might affect this
  ],
  session: {
    strategy: "jwt", // Use JWT for session strategy (required if no database adapter)
  },
  secret: process.env.NEXTAUTH_SECRET, // For JWT signing
  pages: {
    signIn: '/login', // Redirect users to '/login' for signing in
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
    newUser: '/onboarding' // Optional: Redirect new users to an onboarding page
  },
  callbacks: {
    // Use JWT callback to enrich the JWT token
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and provider to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.id = user.id; // Add user ID to token if using DB adapter or custom user object
      }

      // TODO: Fetch backend JWT here?
      // On initial sign in or token refresh, you might want to call your backend
      // to get a specific API token based on the OAuth identity.
      // Store this backend token in the JWT payload.
      // Example:
      // if (!token.apiToken) {
      //    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ provider: token.provider, providerToken: token.accessToken })
      //    });
      //    if (backendResponse.ok) {
      //       const { apiToken } = await backendResponse.json();
      //       token.apiToken = apiToken;
      //    }
      // }

      return token;
    },
    // Use session callback to enrich the session object available client-side
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token.
      session.accessToken = token.accessToken as string; // Or your backend API token
      session.user.id = token.id as string; // Ensure user object in session has ID
      // session.apiToken = token.apiToken as string; // Expose backend token if needed

      return session;
    },
  },
  // Add debug option for development
  debug: process.env.NODE_ENV === 'development',
};

// Note: If using NextAuth v5 (beta), the structure is slightly different (middleware based).
// Consult v5 docs if you opt for that.