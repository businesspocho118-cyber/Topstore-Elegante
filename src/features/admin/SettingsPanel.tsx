"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StoreSettings } from "@/lib/types";

interface SettingsPanelProps {
  settings: StoreSettings;
  onSaved: (updated: StoreSettings) => void;
}

export function SettingsPanel({ settings, onSaved }: SettingsPanelProps) {
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: updateError } = await supabase
        .from("woman_store_settings")
        .update({
          brand_name: form.brand_name.trim(),
          tagline: form.tagline.trim(),
          whatsapp_number: form.whatsapp_number.trim(),
          instagram_handle: form.instagram_handle.trim(),
          parent_brand_url: form.parent_brand_url.trim(),
          announcement_bar: form.announcement_bar.trim(),
          shipping_note: form.shipping_note.trim(),
          default_shipping_cost: Number(form.default_shipping_cost) || 0,
        })
        .eq("id", 1)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        onSaved(data as StoreSettings);
        setMessage("Ajustes guardados correctamente.");
      }
    } catch {
      setError("No se pudieron guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="max-w-3xl rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-6"
    >
      <div>
        <h2 className="font-display text-3xl font-medium text-ink">
          Configuración General
        </h2>
        <p className="text-xs text-ink-soft mt-1">
          Actualiza el WhatsApp de pedidos, barra de anuncios y enlaces de la tienda.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-dusty-rose bg-dusty-rose/10 px-4 py-3 text-xs text-dusty-rose-deep font-medium">
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-gold bg-surface px-4 py-3 text-xs text-ink font-medium">
          <CheckCircle2 className="h-4 w-4 text-rose-gold-deep" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            WhatsApp de Pedidos (con indicativo 57)
          </label>
          <input
            type="text"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            Instagram
          </label>
          <input
            type="text"
            value={form.instagram_handle}
            onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            URL Empresa Madre (TOPSTORE)
          </label>
          <input
            type="url"
            value={form.parent_brand_url}
            onChange={(e) => setForm({ ...form, parent_brand_url: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            Costo de envío estándar (COP, 0 = por confirmar)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.default_shipping_cost}
            onChange={(e) =>
              setForm({
                ...form,
                default_shipping_cost: Number(e.target.value) || 0,
              })
            }
            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            Barra superior de anuncio
          </label>
          <input
            type="text"
            value={form.announcement_bar}
            onChange={(e) => setForm({ ...form, announcement_bar: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5">
            Nota de envíos
          </label>
          <textarea
            rows={2}
            value={form.shipping_note}
            onChange={(e) => setForm({ ...form, shipping_note: e.target.value })}
            className="w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-canvas hover:bg-rose-gold-deep disabled:opacity-50 transition-colors cursor-pointer"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        <span>Guardar Configuración</span>
      </button>
    </form>
  );
}
