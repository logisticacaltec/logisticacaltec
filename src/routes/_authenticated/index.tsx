import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Sparkles,
  Moon,
  Sun,
  ArrowLeft,
  RotateCw,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import totvsLogo from "@/assets/totvs-datasul.png.asset.json";
import fretebrasLogo from "@/assets/fretebras.png.asset.json";

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

type Accent = "green" | "orange" | "navy" | "red";
type Category = "fretes" | "erp" | "gestao";

const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "fretes", label: "Fretes & Transporte" },
  { id: "erp", label: "Sistemas/ERP" },
  { id: "gestao", label: "Gestão" },
];
type IconKey =
  | "truck"
  | "sheet"
  | "shield"
  | "clock"
  | "link"
  | "package"
  | "eye"
  | "map"
  | "store"
  | "receipt"
  | "clipboard";

interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  iconKey?: IconKey;
  logo?: string;
  accent: Accent;
  category?: Category;
  badge?: "star";
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
    title: "Painel de Fretes",
    description: "Consulta de tabelas e cálculo de fretes operacionais.",
    href: "https://tabeladefretes.lovable.app/",
    iconKey: "truck",
    accent: "green",
    category: "fretes",
  },
  {
    id: "transportadores",
    title: "Painel de Transportadores",
    description: "Consulta ao sistema Caltec de dados de transportadores.",
    href: "https://transportadorescaltec.lovable.app",
    iconKey: "shield",
    accent: "red",
    category: "fretes",
  },
  {
    id: "lead-time",
    title: "Lead Time",
    description: "Acompanhamento e análise dos lead times de entrega.",
    href: "https://leadtimecaltec.lovable.app",
    iconKey: "clock",
    accent: "orange",
    category: "gestao",
  },
  {
    id: "totvs-datasul",
    title: "TOTVS Datasul",
    description: "Acesso ao ERP TOTVS Linha Datasul (rede interna Caltec).",
    href: "http://192.168.1.241:8080/totvs-login/loginForm",
    logo: totvsLogo.url,
    accent: "navy",
    category: "erp",
  },
  {
    id: "ojo",
    title: "OJO",
    description: "Plataforma OJO para gestão e monitoramento de operações.",
    href: "https://plataforma.ojo.com.br/painel/#!/contratante",
    iconKey: "eye",
    accent: "navy",
    category: "fretes",
  },
  {
    id: "qualp",
    title: "QUALP",
    description: "Cálculo de rotas, pedágios e distâncias para o transporte.",
    href: "https://qualp.com.br/#/",
    iconKey: "map",
    accent: "green",
    category: "fretes",
  },
  {
    id: "fretebras",
    title: "Fretebras",
    description: "Central de fretes Fretebras para publicação e negociação de cargas.",
    href: "https://novacentral.fretebras.com.br/#/",
    iconKey: "store",
    logo: fretebrasLogo.url,
    accent: "orange",
    category: "fretes",
  },
  {
    id: "efrete",
    title: "eFrete",
    description: "Sistema eFrete para gestão de fretes com transportadoras.",
    href: "https://sistema.efrete.com.br/Transportadoras/Fretes",
    iconKey: "receipt",
    accent: "green",
    category: "fretes",
  },
  {
    id: "pre-embarques",
    title: "Controle do Pátio",
    description: "Controle do pátio e da nossa balança (rede interna Caltec).",
    href: "http://192.168.1.234:8590/Relatorios/PreEmbarques",
    iconKey: "clipboard",
    accent: "navy",
    category: "gestao",
  },
];

const STORAGE_KEY = "logistica_tools_v2";

interface ToolOverride {
  title?: string;
  description?: string;
}

interface StoredState {
  order: string[];
  custom: Tool[];
  hidden: string[];
  overrides: Record<string, ToolOverride>;
}

const EMPTY_STATE: StoredState = { order: [], custom: [], hidden: [], overrides: {} };

// Hosts sem favicon útil (lovable subdomains, sistemas internos) — usar iniciais
const FAVICON_SKIP_HOSTS = ["lovable.app", "efrete.com.br"];

// Hosts que renderizam melhor com "contain" (logos horizontais como Fretebras)
const FAVICON_CONTAIN_HOSTS = ["fretebras.com.br", "novacentral.fretebras.com.br"];

function getFaviconUrl(href: string): string | null {
  try {
    const u = new URL(href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname;
    if (
      host === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      host.endsWith(".local") ||
      FAVICON_SKIP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
    ) {
      return null;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`;
  } catch {
    return null;
  }
}

function faviconNeedsContain(href: string): boolean {
  try {
    const host = new URL(href).hostname;
    return FAVICON_CONTAIN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}


/**
 * Somente os sistemas hospedados no Lovable abrem dentro da Central.
 * Os demais (Fretebras, Qualp, TOTVS, etc.) abrem no navegador.
 */
function canEmbed(href: string): boolean {
  try {
    const host = new URL(href).hostname;
    return host === "lovable.app" || host.endsWith(".lovable.app");
  } catch {
    return false;
  }
}

function getInitials(title: string): string {
  const stop = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "of", "the"]);
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !stop.has(w.toLowerCase()));
  if (words.length === 0) return title.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}


function loadState(): StoredState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // migrate from v1 if present
      const legacy = localStorage.getItem("logistica_tools_v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<StoredState>;
        return {
          order: parsed.order ?? [],
          custom: parsed.custom ?? [],
          hidden: parsed.hidden ?? [],
          overrides: {},
        };
      }
      return EMPTY_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      order: parsed.order ?? [],
      custom: parsed.custom ?? [],
      hidden: parsed.hidden ?? [],
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return EMPTY_STATE;
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
  const all = [...DEFAULT_TOOLS, ...state.custom].map((t) => {
    const o = state.overrides[t.id];
    if (!o) return t;
    return {
      ...t,
      title: o.title ?? t.title,
      description: o.description ?? t.description,
    };
  });
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
  for (const t of byId.values()) ordered.push(t);
  return ordered;
}

function Dashboard() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [dark, setDark] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setState(loadState());
    const saved = localStorage.getItem("logistica_theme");
    const prefers =
      saved === "dark" ||
      (saved === null && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    setDark(prefers);
    document.documentElement.classList.toggle("dark", prefers);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("logistica_theme", next ? "dark" : "light");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const tools = mergeTools(state);

  const filtered = tools
    .filter((t) => category === "all" || (t.category ?? "gestao") === category)
    .filter(
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
    if (!confirm(`Remover "${tool.title}" da tela?`)) return;
    if (tool.custom) {
      const custom = state.custom.filter((t) => t.id !== tool.id);
      const order = state.order.filter((id) => id !== tool.id);
      const overrides = { ...state.overrides };
      delete overrides[tool.id];
      persist({ ...state, custom, order, overrides });
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

  function saveEdit(tool: Tool, title: string, description: string) {
    if (tool.custom) {
      const custom = state.custom.map((t) =>
        t.id === tool.id ? { ...t, title, description } : t,
      );
      persist({ ...state, custom });
    } else {
      const overrides = {
        ...state.overrides,
        [tool.id]: { title, description },
      };
      persist({ ...state, overrides });
    }
    setEditingTool(null);
  }

  function resetAll() {
    if (!confirm("Restaurar layout padrão? Suas alterações serão perdidas.")) return;
    persist(EMPTY_STATE);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[oklch(0.72_0.17_150)]/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-[oklch(0.72_0.17_50)]/10 blur-3xl" />
      </div>

      <header className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.22_0.06_255)] via-[oklch(0.25_0.08_260)] to-[oklch(0.18_0.05_250)] text-white shadow-2xl">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -top-24 right-1/3 h-64 w-64 rounded-full bg-[oklch(0.72_0.17_150)]/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[oklch(0.72_0.17_50)]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/30 backdrop-blur-sm">
                <Package className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[oklch(0.85_0.15_150)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Caltec · Logística
                  </span>
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  Central de Operações
                </h1>
                <p className="text-xs text-white/60 sm:text-sm">
                  Todas as ferramentas do time em um só lugar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleDark}
                title={dark ? "Modo claro" : "Modo escuro"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/20 hover:ring-white/40"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/20 hover:ring-white/40"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>

          </div>

          <div className="relative mt-8">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ferramenta..."
              className="w-full rounded-2xl border-0 bg-white py-4 pl-14 pr-28 text-sm text-slate-900 shadow-2xl ring-1 ring-white/10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.17_150)] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-semibold text-slate-400 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              Ctrl + K
            </kbd>
          </div>

        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[oklch(0.72_0.17_150)] to-[oklch(0.72_0.17_50)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Acessos Rápidos
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">
              Ferramentas do dia a dia
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              title="Adicionar nova ferramenta"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:ring-slate-600"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              title={editMode ? "Concluir edição" : "Editar ferramentas"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                editMode
                  ? "bg-gradient-to-br from-[oklch(0.72_0.17_150)] to-[oklch(0.6_0.17_155)] text-white hover:shadow-md"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:shadow-md hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:ring-slate-600"
              }`}
            >
              {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{editMode ? "Concluir" : "Editar"}</span>
            </button>
          </div>

        </div>

        {editMode && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-900 backdrop-blur-sm">
            <span className="flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Use as setas para reordenar · Ícone de lápis para renomear · Lixeira para remover
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-semibold text-blue-700 hover:underline"
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
              onEdit={() => setEditingTool(tool)}
              onOpen={() => setActiveTool(tool)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Nenhuma ferramenta encontrada.</p>
          </div>
        )}

        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Central de Operações Logísticas · Caltec · Uso interno
        </footer>
      </main>

      {activeTool && <ToolViewer tool={activeTool} onClose={() => setActiveTool(null)} />}
      {showAdd && <AddToolDialog onClose={() => setShowAdd(false)} onAdd={addTool} />}
      {editingTool && (
        <EditToolDialog
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={(title, description) => saveEdit(editingTool, title, description)}
        />
      )}
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
  onEdit,
  onOpen,
}: {
  tool: Tool;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  const Icon = tool.iconKey ? ICONS[tool.iconKey] : LinkIcon;
  const favicon = getFaviconUrl(tool.href);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const showFavicon = !tool.logo && favicon && !faviconFailed;
  const embeds = canEmbed(tool.href);

  const accentGradient =
    tool.accent === "green"
      ? "from-[oklch(0.72_0.17_150)] to-[oklch(0.6_0.17_155)]"
      : tool.accent === "orange"
        ? "from-[oklch(0.75_0.17_50)] to-[oklch(0.62_0.17_45)]"
        : tool.accent === "red"
          ? "from-[oklch(0.65_0.22_25)] to-[oklch(0.52_0.22_20)]"
          : "from-[oklch(0.35_0.09_260)] to-[oklch(0.22_0.06_255)]";

  const accentGlow =
    tool.accent === "green"
      ? "shadow-[0_20px_40px_-15px_oklch(0.72_0.17_150/0.5)]"
      : tool.accent === "orange"
        ? "shadow-[0_20px_40px_-15px_oklch(0.72_0.17_50/0.5)]"
        : tool.accent === "red"
          ? "shadow-[0_20px_40px_-15px_oklch(0.6_0.22_25/0.55)]"
          : "shadow-[0_20px_40px_-15px_oklch(0.22_0.06_255/0.5)]";

  const accentRing =
    tool.accent === "green"
      ? "group-hover:ring-[oklch(0.72_0.17_150)]/40"
      : tool.accent === "orange"
        ? "group-hover:ring-[oklch(0.72_0.17_50)]/40"
        : tool.accent === "red"
          ? "group-hover:ring-[oklch(0.6_0.22_25)]/40"
          : "group-hover:ring-[oklch(0.22_0.06_255)]/40";

  const inner = (
    <>
      {/* Accent stripe */}
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${accentGradient}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="relative">
            <div
              className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${
                showFavicon
                  ? "bg-white ring-1 ring-slate-200"
                  : `bg-gradient-to-br ${accentGradient} text-white ${accentGlow}`
              } transition-transform group-hover:scale-110 group-hover:rotate-3`}
            >
              {tool.logo ? (
                <img src={tool.logo} alt={tool.title} className="h-full w-full object-contain p-1" />
              ) : showFavicon ? (
                <img
                  src={favicon}
                  alt={tool.title}
                  className={`h-full w-full ${faviconNeedsContain(tool.href) ? "object-contain p-1" : "object-cover"}`}
                  onError={() => setFaviconFailed(true)}
                />
              ) : (
                <Icon className="h-8 w-8" strokeWidth={2.2} />
              )}
            </div>

          </div>
          {!editMode && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-slate-900 group-hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{tool.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{tool.description}</p>
      </div>
      {!editMode && (
        <div className="relative mt-6 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
            Abrir ferramenta
          </span>
          <div
            className={`h-8 w-8 rounded-full bg-gradient-to-br ${accentGradient} opacity-0 transition-opacity group-hover:opacity-100`}
            style={{
              maskImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12h14M13 5l7 7-7 7'/></svg>\")",
              WebkitMaskImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12h14M13 5l7 7-7 7'/></svg>\")",
              maskSize: "18px",
              WebkitMaskSize: "18px",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </div>
      )}
    </>
  );

  if (editMode) {
    return (
      <div className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-md ring-2 ring-dashed ring-slate-300 dark:bg-slate-800 dark:ring-slate-600">
        {inner}
        <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="rounded-lg p-1.5 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
              title="Mover para cima"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="rounded-lg p-1.5 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
              title="Mover para baixo"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-blue-600 ring-1 ring-blue-100 transition-colors hover:bg-blue-50"
              title="Renomear"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-50"
              title={tool.custom ? "Excluir ferramenta" : "Ocultar ferramenta"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={tool.href}
      target={embeds ? undefined : "_blank"}
      rel={embeds ? undefined : "noopener noreferrer"}
      onClick={(e) => {
        // Sistemas Lovable abrem dentro da Central; os demais vão para o navegador.
        if (!embeds) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onOpen();
      }}
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-2 dark:bg-slate-800 dark:ring-slate-700/60 ${accentRing}`}
    >
      {inner}
    </a>
  );
}

/**
 * Visualizador interno: mantém o usuário dentro da Central de Operações.
 * Alguns sites bloqueiam incorporação (X-Frame-Options/CSP); nesse caso
 * mostramos um aviso com a opção de abrir externamente.
 */
function ToolViewer({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setBlocked(false);
    const t = window.setTimeout(() => {
      setLoaded((isLoaded) => {
        if (!isLoaded) setBlocked(true);
        return isLoaded;
      });
    }, 8000);
    return () => window.clearTimeout(t);
  }, [tool.id, reloadKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Início
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{tool.title}</p>
          <p className="truncate text-[11px] text-slate-400">{tool.href}</p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          title="Recarregar"
          className="rounded-xl p-2 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <a
          href={tool.href}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir em nova janela"
          className="rounded-xl p-2 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="relative flex-1">
        {!loaded && !blocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Carregando {tool.title}...
          </div>
        )}
        {blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Este sistema não permite ser exibido dentro da Central.
            </p>
            <p className="max-w-md text-xs text-slate-500">
              Por segurança, {tool.title} bloqueia a incorporação. Abra em uma janela separada.
            </p>
            <a
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir {tool.title}
            </a>
          </div>
        )}
        <iframe
          key={reloadKey}
          src={tool.href}
          title={tool.title}
          onLoad={() => {
            setLoaded(true);
            setBlocked(false);
          }}
          className="h-full w-full border-0 bg-white"
          referrerPolicy="no-referrer-when-downgrade"
          allow="clipboard-read; clipboard-write; fullscreen; geolocation"
        />
      </div>
    </div>
  );
}


function EditToolDialog({
  tool,
  onClose,
  onSave,
}: {
  tool: Tool;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState(tool.title);
  const [description, setDescription] = useState(tool.description);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Editar ferramenta</h3>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
            />
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
              className="rounded-lg bg-gradient-to-br from-[oklch(0.72_0.17_150)] to-[oklch(0.6_0.17_155)] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
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
                <option value="eye">Olho</option>
                <option value="map">Mapa</option>
                <option value="store">Loja</option>
                <option value="receipt">Recibo</option>
                <option value="clipboard">Prancheta</option>
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
              className="rounded-lg bg-gradient-to-br from-[oklch(0.72_0.17_150)] to-[oklch(0.6_0.17_155)] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
