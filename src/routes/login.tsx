import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Lumix Recovery Dashboard" },
      { name: "description", content: "Acesse o dashboard Lumix de recuperação de vendas." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !pwd) {
      setErr("Preencha email e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) {
      setErr("Email ou senha incorretos.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-black bg-radial-glow flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] mx-4 md:mx-0 rounded-2xl bg-[#0d0d0d] border border-[#1e1e1e] p-6 md:p-10">
        <div className="flex justify-center">
          <Logo variant="icon" className="h-24 w-auto object-contain" />
        </div>
        <p className="text-center text-xs text-[#666] mt-3 mb-8">
          Recovery Dashboard
        </p>
        <div className="border-t border-[#1a1a1a] mb-7" />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="h-11 w-full rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] px-3.5 text-sm text-white placeholder-[#444] focus:border-[#80d7f8] focus:[box-shadow:0_0_0_3px_rgba(128,215,248,0.10)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] px-3.5 pr-11 text-sm text-white placeholder-[#444] focus:border-[#80d7f8] focus:[box-shadow:0_0_0_3px_rgba(128,215,248,0.10)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#ccc] transition-colors"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {err && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] text-[#ef4444]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle size={14} />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-[10px] bg-[#80d7f8] text-black font-bold transition-all duration-150 hover:bg-[#a8e8ff] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            )}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
