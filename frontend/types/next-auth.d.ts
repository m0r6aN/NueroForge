// neuroforge/frontend/types/next-auth.d.ts
// Purpose: Extends NextAuth types for session/JWT enrichment

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string; // Or apiToken
    user: {
      id?: string | null; // Add the user ID field
    } & DefaultSession["user"]; // Keep the default fields
  }

   /** Extends the default User type */
//   interface User extends DefaultUser {
//     // Add custom fields here if using a database adapter and custom user model
//     role?: string;
//   }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** OpenID ID Token */
    id?: string; // Add user ID to JWT
    accessToken?: string; // Provider access token
    provider?: string;
    apiToken?: string; // Custom backend API token
    // Add other custom fields you add in the jwt callback
  }
}