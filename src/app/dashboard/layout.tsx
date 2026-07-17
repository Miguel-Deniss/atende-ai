import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/dashboard/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#0F172A]">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
