import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Truck,
  FileSpreadsheet,
  ShieldCheck,
  Plus,
  ExternalLink,
  Package,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Central de Operações Logísticas" },
      {
        name: "description",
        content:
          "Portal da equipe de Logística",
      },
      { property: "og:title", content: "Central de Operações Logísticas" },
      {
        property: "og:description",
        content:
          "Portal da equipe de Logística",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Dashboard,
});

interface Tool {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "orange";
}

const tools: Tool[] = [
  {
    title: "Tabela de Fretes",
    description: "Consulta de tabelas e cálculo de fretes operacionais.",
    href: "https://tabeladefretes.lovable.app/",
    icon: Truck,
    accent: "green",
  },
  {
    title: "Planilha de Cotação de Frete",
    description:
      "Acesso direto à planilha oficial de cotações e simulações.",
    href: "https://docs.google.com/spreadsheets/d/1kq3rg1h2jV3lmGWpX-qKfLJkrhf6eAU19iZ1-nHHzeA/edit?usp=sharing",
    icon: FileSpreadsheet,
    accent: "orange",
  },
  {
    title: "Dados de Transportadores",
    description: "Consulta ao sistema Caltec de dados de transportadores.",
    href: "https://transportadorescaltec.lovable.app",
    icon: ShieldCheck,
    accent: "green",
  },
];

function Dashboard() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = tools.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-[oklch(0.22_0.06_255)] text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Package className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  Central de Operações Logísticas
                </h1>
                <p className="text-xs text-white/70 sm:text-sm">
                  Portal interno da equipe de Logística
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs uppercase tracking-widest text-white/60">
                  Equipe
                </p>
                <p className="text-sm font-medium">Logística</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ferramenta ou documento..."
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-md ring-1 ring-white/10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.17_150)]"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Acessos Rápidos
            </h2>
            <p className="text-sm text-slate-500">
              Ferramentas essenciais do dia a dia
            </p>
          </div>
          <span className="hidden text-xs font-medium text-slate-400 sm:block">
            {filtered.length} de {tools.length} ferramentas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}

          {/* Placeholder card */}
          <button
            type="button"
            className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-transparent p-6 text-slate-500 transition-all hover:border-[oklch(0.72_0.17_150)] hover:bg-white hover:text-[oklch(0.55_0.14_150)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 transition-colors group-hover:bg-[oklch(0.72_0.17_150)]/15">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Adicionar Nova Ferramenta</p>
              <p className="mt-1 text-xs text-slate-400">(Em breve)</p>
            </div>
          </button>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Central de Operações Logísticas · Uso
          interno
        </footer>
      </main>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const accentBg =
    tool.accent === "green"
      ? "bg-[oklch(0.72_0.17_150)] hover:bg-[oklch(0.65_0.17_150)]"
      : "bg-[oklch(0.72_0.17_50)] hover:bg-[oklch(0.65_0.17_50)]";
  const iconBg =
    tool.accent === "green"
      ? "bg-[oklch(0.72_0.17_150)]/10 text-[oklch(0.5_0.15_150)]"
      : "bg-[oklch(0.72_0.17_50)]/10 text-[oklch(0.55_0.17_50)]";

  return (
    <a
      href={tool.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[200px] flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-[oklch(0.22_0.06_255)]/20"
    >
      <div>
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">
          {tool.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {tool.description}
        </p>
      </div>
      <div className="mt-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${accentBg}`}
        >
          Acessar ferramenta
        </span>
      </div>
    </a>
  );
}
