import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <AuthHeader />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
      <AuthFooter />
    </AuthShell>
  );
}
