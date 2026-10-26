"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Headphones, HelpCircle, Send, CheckCircle, MessageSquare } from "lucide-react";

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("CASINO");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Faça login para abrir chamados de suporte.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubject("");
        setMessage("");
        setFeedback("Chamado aberto com sucesso! Nossa equipe técnica responderá em instantes.");
        await loadTickets();
      } else {
        alert(data.error || "Erro ao criar chamado.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: "Esta plataforma utiliza dinheiro real?",
      a: "Não. A plataforma Apex Bet & Casino é exclusivamente demonstrativa para pesquisa e validação técnica de integrações. Todos os saldos e transações utilizam créditos virtuais sem qualquer valor monetário, sem depósitos, saques ou conversão.",
    },
    {
      q: "Como recarrego meu saldo de créditos fictícios?",
      a: "Você pode clicar no botão de Faucet / Recarga no topo da página ou na aba 'Carteira Virtual'. O saldo é imediatamente restabelecido para R$ 10.000,00 fictícios gratuitamente.",
    },
    {
      q: "Como funciona a integração com provedores oficiais (Pragmatic, PG Soft, Evolution, Spribe)?",
      a: "A plataforma possui um Game Integration Gateway com adaptadores independentes padronizados. Quando credenciais e sandboxes oficiais são configuradas no Painel Admin, a plataforma inicializa sessões autenticadas nos servidores do fornecedor. Sem credenciais, operam simuladores demonstrativos seguros locais.",
    },
    {
      q: "Os jogos Apex Originals são auditáveis (Provably Fair)?",
      a: "Sim. Todos os jogos originais (Crash, Mines, Plinko, Roleta, Blackjack, Dice) utilizam seeds criptográficas (HMAC-SHA256) validadas exclusivamente no backend para total transparência.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Headphones className="w-6 h-6 text-brand-accent" />
          Central de Ajuda & Suporte Técnico
        </h1>
        <p className="text-xs text-brand-textSecondary mt-0.5">
          Tire dúvidas frequentes ou abra um ticket de atendimento com a equipe.
        </p>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-brand-border pb-3">
          <HelpCircle className="w-5 h-5 text-brand-accent" />
          Perguntas Frequentes (FAQ)
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-brand-darkest border border-brand-border/70 rounded-xl space-y-1.5">
              <h3 className="font-bold text-xs text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                {faq.q}
              </h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed pl-3.5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Creation & List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Form */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-brand-border pb-3">
            <Send className="w-4 h-4 text-brand-accent" />
            Abrir Chamado de Suporte
          </h2>

          {feedback && (
            <div className="p-3 bg-green-950/70 border border-green-800 rounded-xl text-xs text-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                Assunto
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ex: Dúvida sobre odd esportiva ou integração"
                className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-accent"
              >
                <option value="CASINO">Cassino & Jogos</option>
                <option value="SPORTS">Apostas Esportivas</option>
                <option value="WALLET">Carteira Virtual & Faucet</option>
                <option value="TECHNICAL">Suporte Técnico & APIs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                Mensagem
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva detalhadamente sua solicitação..."
                className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-accent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-accent text-brand-darkest font-bold text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Chamado"}
            </button>
          </form>
        </div>

        {/* User Tickets History */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-brand-border pb-3">
            <MessageSquare className="w-4 h-4 text-brand-accent" />
            Meus Chamados Abertos
          </h2>

          {tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-brand-textMuted">
              Nenhum chamado aberto no momento.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {tickets.map((t) => (
                <div key={t.id} className="p-3 bg-brand-darkest border border-brand-border/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{t.subject}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-950/70 border border-blue-800 text-blue-300">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-textSecondary">
                    {t.messages?.[0]?.message}
                  </p>
                  <span className="text-[9px] text-brand-textMuted block">
                    {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
