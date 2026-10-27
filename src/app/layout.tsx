import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { BetSlipProvider } from "@/context/bet-slip-context";
import { ComplianceBanner } from "@/components/common/ComplianceBanner";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { BetSlipModal } from "@/components/layout/BetSlipModal";

export const metadata: Metadata = {
  title: "Apex Bet & Casino | Plataforma Demonstrativa de Apostas e Cassino",
  description:
    "Plataforma completa de apostas esportivas e jogos de cassino com motor RNG próprio, integração de provedores B2B e créditos virtuais fictícios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-brand-bg text-brand-textPrimary flex flex-col antialiased selection:bg-brand-accent selection:text-brand-darkest font-sans">
        <AuthProvider>
          <BetSlipProvider>
            <ComplianceBanner />
            <PremiumHeader />
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
              <SidebarNavigation />
              <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-12 overflow-y-auto">
                {children}
              </main>
            </div>
            <MobileBottomNav />
            <BetSlipModal />
          </BetSlipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
