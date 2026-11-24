"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedUid, setUnauthorizedUid] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnauthorizedUid(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user) {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
        setLoading(false);
        return;
      }

      const { data: adminRow, error: adminErr } = await supabase
        .from("woman_admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminErr) {
        setError(
          "Las tablas de TOPSTORE WOMAN aún no están ejecutadas en Supabase. Ejecuta supabase/schema.sql primero."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!adminRow) {
        setUnauthorizedUid(data.user.id);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión con Supabase. Revisa tu configuración.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al catálogo</span>
        </Link>

        <div className="rounded-3xl border border-line bg-card p-8 shadow-[0_24px_60px_rgba(43,31,27,0.08)]">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-rose-gold/60 shadow-xs">
              <Image
                src="/media/logo.jpeg"
                alt="TOPSTORE WOMAN"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-dusty-rose">
                Acceso Privado
              </p>
              <h1 className="font-display text-3xl font-medium text-ink mt-1">
                Panel Administrador
              </h1>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-dusty-rose bg-dusty-rose/10 p-3.5 text-xs text-dusty-rose-deep font-medium"
            >
              {error}
            </div>
          )}

          {unauthorizedUid && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-rose-gold bg-surface p-4 text-xs text-ink space-y-2"
            >
              <div className="flex items-center gap-2 font-semibold text-dusty-rose-deep">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Usuario autenticado sin permiso admin</span>
              </div>
              <p className="text-ink-soft leading-relaxed">
                Autoriza este usuario ejecutando esta línea en el SQL Editor de Supabase:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-ink p-2.5 text-[11px] text-canvas">
{`insert into public.woman_admin_users (user_id, email)
values ('${unauthorizedUid}', '${email.trim()}');`}
              </pre>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
              >
                Correo administrador
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@topstorecolombia.com"
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-rose-gold-deep disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Ingresar al Panel</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
