import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  Truck,
  FileSpreadsheet,
  ShieldCheck,
  Plus,
  ExternalLink,
  Package,
  LogOut,
  Clock,
  Link as LinkIcon,
  Pencil,
  Check,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Eye,
  Map as MapIcon,
  Store,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import totvsLogo from "@/assets/totvs-datasul.png.asset.json";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Central de Operações Logísticas" },
      { name: "description", content: "Portal da equipe de Logística" },
      { property: "og:title", content: "Central de Operações Logísticas" },
      { property: "og:description", content: "Portal da equipe de Logística" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Dashboard,
});

type Accent = "green" | "orange" | "navy";
type IconKey = "truck" | "sheet" | "shield" | "clock" | "link" | "package" | "eye" | "map" | "store" | "receipt" | "clipboard";

interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  iconKey?: IconKey;
  logo?: string;
  accent: Accent;
  custom?: boolean;
}

const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  sheet: FileSpreadsheet,
  shield: ShieldCheck,
  clock: Clock,
  link: LinkIcon,
  package: Package,
  eye: Eye,
  map: MapIcon,
  store: Store,
  receipt: Receipt,
  clipboard: ClipboardList,
};

const DEFAULT_TOOLS: Tool[] = [
  {
    id: "tabela-fretes",
    title: "Tabela de Fretes",
    description: "Consulta de tabelas e cálculo de fretes operacionais.",
    href: "https://tabeladefretes.lovable.app/",
    iconKey: "truck",
    accent: "green",
  },
  {
    id: "cotacao-frete",
    title: "Planilha de Cotação de Frete",
    description: "Acesso direto à planilha oficial de cotações e simulações.",
    href: "https://docs.google.com/spreadsheets/d/1kq3rg1h2jV3lmGWpX-qKfLJkrhf6eAU19iZ1-nHHzeA/edit?usp=sharing",
    iconKey: "sheet",
    accent: "orange",
  },
  {
    id: "transportadores",
    title: "Dados de Transportadores",
    description: "Consulta ao sistema Caltec de dados de transportadores.",
    href: "https://transportadorescaltec.lovable.app",
    iconKey: "shield",
    accent: "green",
  },
  {
    id: "lead-time",
    title: "Lead Time",
    description: "Acompanhamento e análise dos lead times de entrega.",
    href: "https://leadtimecaltec.lovable.app",
    iconKey: "clock",
    accent: "orange",
  },
  {
    id: "totvs-datasul",
    title: "TOTVS Datasul",
    description: "Acesso ao ERP TOTVS Linha Datasul (rede interna Caltec).",
    href: "http://192.168.1.241:8080/totvs-login/loginForm",
    logo: totvsLogo.url,
    accent: "navy",
  },
  {
    id: "ojo",
    title: "OJO",
    description: "Plataforma OJO para gestão e monitoramento de operações.",
    href: "https://plataforma.ojo.com.br/painel/#!/contratante",
    iconKey: "eye",
    accent: "navy",
  },
  {
    id: "qualp",
    title: "QUALP",
    description: "Cálculo de rotas, pedágios e distâncias para o transporte.",
    href: "https://qualp.com.br/#/",
    iconKey: "map",
    accent: "green",
  },
  {
    id: "fretebras",
    title: "Fretebras",
    description: "Central de fretes Fretebras para publicação e negociação de cargas.",
    href: "https://novacentral.fretebras.com.br/#/",
    iconKey: "store",
    accent: "orange",
  },
  {
    id: "efrete",
    title: "eFrete",
    description: "Sistema eFrete para gestão de fretes com transportadoras.",
    href: "https://sistema.efrete.com.br/Transportadoras/Fretes",
    iconKey: "receipt",
    accent: "green",
  },
  {
    id: "pre-embarques",
    title: "Relatórios Pré-Embarques",
    description: "Relatórios de pré-embarques (rede interna Caltec).",
    href: "http://192.168.1.234:8590/Relatorios/PreEmbarques",
    iconKey: "clipboard",
    accent: "navy",
  },
];

const STORAGE_KEY = "logistica_tools_v1";

interface StoredState {
  order: string[]; // ordered list of tool ids
  custom: Tool[]; // user-added tools
  hidden: string[]; // hidden default ids
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { order: [], custom: [], hidden: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [], custom: [], hidden: [] };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      order: parsed.order ?? [],
      custom: parsed.custom ?? [],
      hidden: parsed.hidden ?? [],
    };
  } catch {
    return { order: [], custom: [], hidden: [] };
  }
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

function mergeTools(state: StoredState): Tool[] {
  const all = [...DEFAULT_TOOLS, ...state.custom];
  const visible = all.filter((t) => !state.hidden.includes(t.id));
  const byId = new Map(visible.map((t) => [t.id, t]));
  const ordered: Tool[] = [];
  for (const id of state.order) {
    const t = byId.get(id);
    if (t) {
      ordered.push(t);
      byId.delete(id);
    }
  }
  // append remaining (new defaults or custom) at the end
  for (const t of byId.values()) ordered.push(t);
  return ordered;
}

function Dashboard() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<StoredState>({ order: [], custom: [], hidden: [] });
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setState(loadState());
  }, []);

  const tools = mergeTools(state);

  const filtered = tools.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()),
  );

  function persist(next: StoredState) {
    setState(next);
    saveState(next);
  }

  function moveTool(id: string, dir: -1 | 1) {
    const ids = tools.map((t) => t.id);
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    persist({ ...state, order: ids });
  }

  function removeTool(tool: Tool) {
    if (tool.custom) {
      const custom = state.custom.filter((t) => t.id !== tool.id);
      const order = state.order.filter((id) => id !== tool.id);
      persist({ ...state, custom, order });
    } else {
      persist({ ...state, hidden: [...state.hidden, tool.id] });
    }
  }

  function addTool(t: Omit<Tool, "id" | "custom">) {
    const id = `custom-${Date.now()}`;
    const newTool: Tool = { ...t, id, custom: true };
    const custom = [...state.custom, newTool];
    const order = [...(state.order.length ? state.order : tools.map((x) => x.id)), id];
    persist({ ...state, custom, order });
  }

  function resetAll() {
    persist({ order: [], custom: [], hidden: [] });
  }

  return (
    <div className="min-h-screen bg-slate-100">
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
                <p className="text-xs uppercase tracking-widest text-white/60">Equipe</p>
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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Acessos Rápidos</h2>
            <p className="text-sm text-slate-500">Ferramentas essenciais do dia a dia</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              title="Adicionar nova ferramenta"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              title={editMode ? "Concluir edição" : "Reordenar ferramentas"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
                editMode
                  ? "bg-[oklch(0.72_0.17_150)] text-white ring-transparent hover:bg-[oklch(0.65_0.17_150)]"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{editMode ? "Concluir" : "Editar"}</span>
            </button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-xs text-blue-900 ring-1 ring-blue-100">
            <span>
              Use as setas para reordenar. Remova ferramentas com o ícone de lixeira.
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Restaurar padrão
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool, idx) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              editMode={editMode}
              isFirst={idx === 0}
              isLast={idx === filtered.length - 1}
              onMoveUp={() => moveTool(tool.id, -1)}
              onMoveDown={() => moveTool(tool.id, 1)}
              onRemove={() => removeTool(tool)}
            />
          ))}
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Central de Operações Logísticas · Uso interno
        </footer>
      </main>

      {showAdd && <AddToolDialog onClose={() => setShowAdd(false)} onAdd={addTool} />}
    </div>
  );
}

function ToolCard({
  tool,
  editMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  tool: Tool;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const Icon = tool.iconKey ? ICONS[tool.iconKey] : LinkIcon;
  const accentBg =
    tool.accent === "green"
      ? "bg-[oklch(0.72_0.17_150)] hover:bg-[oklch(0.65_0.17_150)]"
      : tool.accent === "orange"
        ? "bg-[oklch(0.72_0.17_50)] hover:bg-[oklch(0.65_0.17_50)]"
        : "bg-[oklch(0.22_0.06_255)] hover:bg-[oklch(0.18_0.06_255)]";
  const iconBg =
    tool.accent === "green"
      ? "bg-[oklch(0.72_0.17_150)]/10 text-[oklch(0.5_0.15_150)]"
      : tool.accent === "orange"
        ? "bg-[oklch(0.72_0.17_50)]/10 text-[oklch(0.55_0.17_50)]"
        : "bg-slate-100 text-[oklch(0.22_0.06_255)]";

  const inner = (
    <>
      <div>
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl ${iconBg}`}
          >
            {tool.logo ? (
              <img src={tool.logo} alt={tool.title} className="h-8 w-8 object-contain" />
            ) : (
              <Icon className="h-6 w-6" />
            )}
          </div>
          {!editMode && (
            <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
          )}
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">{tool.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{tool.description}</p>
      </div>
      {!editMode && (
        <div className="mt-5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${accentBg}`}
          >
            Acessar ferramenta
          </span>
        </div>
      )}
    </>
  );

  if (editMode) {
    return (
      <div className="group relative flex min-h-[200px] flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-2 ring-dashed ring-slate-300">
        {inner}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="rounded-md p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-30"
              title="Mover para cima"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="rounded-md p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-30"
              title="Mover para baixo"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-md p-1.5 text-red-600 ring-1 ring-red-100 hover:bg-red-50"
            title={tool.custom ? "Excluir ferramenta" : "Ocultar ferramenta"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={tool.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[200px] flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-[oklch(0.22_0.06_255)]/20"
    >
      {inner}
    </a>
  );
}

function AddToolDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (tool: Omit<Tool, "id" | "custom">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [href, setHref] = useState("");
  const [accent, setAccent] = useState<Accent>("green");
  const [iconKey, setIconKey] = useState<IconKey>("link");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !href.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || "Ferramenta adicionada pela equipe.",
      href: href.trim(),
      accent,
      iconKey,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Nova ferramenta</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Título *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Sistema de Rastreamento"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Link (URL) *</label>
            <input
              required
              type="url"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da ferramenta"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Ícone</label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value as IconKey)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
              >
                <option value="link">Link</option>
                <option value="truck">Caminhão</option>
                <option value="sheet">Planilha</option>
                <option value="shield">Escudo</option>
                <option value="clock">Relógio</option>
                <option value="package">Pacote</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Cor</label>
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value as Accent)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
              >
                <option value="green">Verde</option>
                <option value="orange">Laranja</option>
                <option value="navy">Azul</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[oklch(0.72_0.17_150)] px-4 py-2 text-sm font-semibold text-white hover:bg-[oklch(0.65_0.17_150)]"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
