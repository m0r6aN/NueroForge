// neuroforge/frontend/app/(app)/layout.tsx
// Purpose: Layout for authenticated sections of the app
import { Navbar } from "components/layout/Navbar";
import { Sidebar } from "components/layout/Sidebar";
import { BinauralPlayer } from "components/audio/BinauralPlayer";
// import { checkAuth } from '@/lib/auth'; // Server-side check if needed

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Optional: Server-side session check to redirect if not logged in
  // const session = await checkAuth(); // Implement checkAuth using getServerSession
  // if (!session) { redirect('/login'); }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="fixed bottom-4 right-4 z-50">
              <BinauralPlayer />
           </div>
          {/* Content area for authenticated pages */}
          {children}
        </main>
      </div>
    </div>
  );
}