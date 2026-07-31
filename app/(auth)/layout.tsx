import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      {children}
    </div>
  );
}
