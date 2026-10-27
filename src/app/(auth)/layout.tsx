import type { ReactNode } from "react";
import LanguageSelector from "@/components/LanguageSelector";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <><div className="auth-language"><LanguageSelector /></div><main className="flex min-h-screen items-center justify-center bg-[#F8F9F6] p-6">{children}</main></>;
}
