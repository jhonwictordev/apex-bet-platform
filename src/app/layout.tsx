import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { BetSlipProvider } from "@/context/bet-slip-context";
import { ComplianceBanner } from "@/components/common/ComplianceBanner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
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
      <body className="min-h-screen bg-brand-darkest text-brand-textPrimary flex flex-col antialiased selection:bg-brand-accent selection:text-brand-darkest">
        <AuthProvider>
          <BetSlipProvider>
            <ComplianceBanner />
            <Header />
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
              <Sidebar />
              <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 overflow-y-auto">
                {children}
              </main>
            </div>
            <BetSlipModal />
          </BetSlipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
