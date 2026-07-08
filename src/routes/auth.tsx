import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Central de Operações Logísticas" },
      { name: "description", content: "Acesso restrito à equipe de Logística Caltec." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const ALLOWED_EMAILS = [
  "kelvin.vicente@caltec.com.br",
  "robson.melo@caltec.com.br",
  "toniel.ramos@caltec.com.br",
  "joao.rigueiral@caltec.com.br",
  "guilherme.selinski@caltec.com.br",
];

// Quando "manter conectado" está desativado, a sessão é encerrada ao fechar a aba.
function armEphemeralSession(remember: boolean) {
  if (typeof window === "undefined") return;
  const KEY = "__ephemeral_signout_handler";
  const w = window as unknown as Record<string, unknown>;
  if (w[KEY]) {
    window.removeEventListener("beforeunload", w[KEY] as () => void);
    delete w[KEY];
  }
  if (!remember) {
    const handler = () => {
      // best-effort: limpa o token persistido
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("beforeunload", handler);
    w[KEY] = handler;
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const isAllowed = (e: string) => ALLOWED_EMAILS.includes(e.trim().toLowerCase());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (mode !== "forgot" && !isAllowed(cleanEmail)) {
      toast.error("E-mail não autorizado. Fale com o administrador.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        armEphemeralSession(remember);
        toast.success("Bem-vindo!");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        if (password.length < 6) {
          toast.error("A senha precisa ter pelo menos 6 caracteres.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        armEphemeralSession(remember);
        toast.success("Cadastro criado! Entrando...");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar";
      const friendly =
        msg.includes("Invalid login")
          ? "E-mail ou senha inválidos."
          : msg.includes("already registered")
            ? "Este e-mail já tem cadastro. Faça login."
            : msg;
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.22_0.06_255)] text-white shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Central de Operações Logísticas
          </h1>
          <p className="mt-1 text-sm text-slate-500">Acesso restrito à equipe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-8">
          {mode !== "forgot" && (
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "signin"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Criar senha
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Esqueci minha senha</h2>
              <p className="text-sm text-slate-500 mt-1">
                Informe seu e-mail e enviaremos um link para redefinir.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail corporativo
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@caltec.com.br"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)] focus:border-transparent"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Senha {mode === "signup" && <span className="text-slate-400 font-normal">(mín. 6 caracteres)</span>}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)] focus:border-transparent"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[oklch(0.22_0.06_255)] focus:ring-[oklch(0.22_0.06_255)]"
                  />
                  <span className="text-sm text-slate-600">Manter conectado</span>
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm font-medium text-[oklch(0.55_0.14_150)] hover:underline"
                  >
                    Esqueci a senha
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.72_0.17_150)] hover:bg-[oklch(0.65_0.17_150)] disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" && "Entrar"}
              {mode === "signup" && "Criar conta"}
              {mode === "forgot" && "Enviar link de redefinição"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                ← Voltar ao login
              </button>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Acesso limitado à equipe autorizada · Caltec Logística
        </p>
      </div>
    </div>
  );
}
