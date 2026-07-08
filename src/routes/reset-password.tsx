import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Redefinir senha · Central de Operações Logísticas" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // A URL do e-mail traz o token na hash; o SDK trata automaticamente.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao redefinir senha");
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
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Redefinir senha</h1>
          <p className="mt-1 text-sm text-slate-500">Escolha uma nova senha para sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-8">
          {!ready ? (
            <div className="text-center text-sm text-slate-500 py-6">
              Abra este link a partir do e-mail de redefinição enviado a você.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.22_0.06_255)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.72_0.17_150)] hover:bg-[oklch(0.65_0.17_150)] disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar nova senha
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
