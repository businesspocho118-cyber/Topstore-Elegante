"use client";

import { useState } from "react";
import { X, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { useCartStore } from "./useCartStore";
import {
  buildWhatsAppOrderUrl,
  calculateOrderTotals,
  formatCOP,
} from "@/lib/format";
import { createSupabaseBrowserClient, getSupabaseEnv } from "@/lib/supabase/client";
import type { CartItem, StoreSettings } from "@/lib/types";

const orderItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  product_name: z.string().min(1),
  color_name: z.string().min(1),
  size: z.string().min(1).max(20),
  quantity: z.number().int().min(1).max(50),
  unit_price: z.number().int().min(0),
});

const createOrderSchema = z.object({
  customer_name: z.string().trim().min(2, "Ingresa tu nombre completo").max(120),
  customer_phone: z.string().trim().min(7, "Ingresa un número de WhatsApp válido").max(40),
  customer_city: z.string().trim().min(2, "Ingresa tu ciudad").max(80),
  customer_address: z.string().trim().min(4, "Ingresa tu dirección de envío").max(240),
  payment_method: z.string().trim().min(2).max(80).default("WhatsApp / Transferencia"),
  notes: z.string().trim().max(500).optional().default(""),
  items: z.array(orderItemSchema).min(1, "Agrega al menos una prenda"),
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CheckoutModalProps {
  settings: StoreSettings;
  onClose: () => void;
}

interface ConfirmedOrder {
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  whatsappUrl: string;
  persisted: boolean;
}

export function CheckoutModal({ settings, onClose }: CheckoutModalProps) {
  const { items, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia Bancolombia / Nequi");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);

  const totals = calculateOrderTotals(items, settings.default_shipping_cost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const snapshotItems: CartItem[] = [...items];

    try {
      const parsed = createOrderSchema.safeParse({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_city: customerCity,
        customer_address: customerAddress,
        payment_method: paymentMethod,
        notes,
        items: snapshotItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          product_name: i.product_name,
          color_name: i.color_name,
          size: i.size,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Datos de pedido inválidos");
        setSubmitting(false);
        return;
      }

      const data = parsed.data;
      const allItemsHaveUuid = data.items.every(
        (item) => uuidRegex.test(item.product_id) && uuidRegex.test(item.variant_id)
      );

      let orderData: {
        order_number: string;
        subtotal: number;
        shipping_cost: number;
        total: number;
      } | null = null;
      let persisted = false;

      if (getSupabaseEnv() && allItemsHaveUuid) {
        const supabase = createSupabaseBrowserClient();
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "create_woman_order",
          {
            p_customer_name: data.customer_name,
            p_customer_phone: data.customer_phone,
            p_customer_city: data.customer_city,
            p_customer_address: data.customer_address,
            p_payment_method: data.payment_method,
            p_notes: data.notes,
            p_items: data.items.map((item) => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              color_name: item.color_name,
              size: item.size,
              quantity: item.quantity,
            })),
          }
        );

        if (!rpcError && rpcData) {
          orderData = rpcData as {
            order_number: string;
            subtotal: number;
            shipping_cost: number;
            total: number;
          };
          persisted = true;
        }
      }

      if (!orderData) {
        const fallbackTotals = calculateOrderTotals(
          snapshotItems,
          settings.default_shipping_cost
        );
        orderData = {
          order_number: `TSW-${new Date().getFullYear()}-${String(
            Math.floor(1000 + Math.random() * 9000)
          )}`,
          subtotal: fallbackTotals.subtotal,
          shipping_cost: fallbackTotals.shipping_cost,
          total: fallbackTotals.total,
        };
      }

      const whatsappUrl = buildWhatsAppOrderUrl({
        storePhone: settings.whatsapp_number,
        orderNumber: orderData.order_number,
        customerName: data.customer_name,
        customerCity: data.customer_city,
        customerAddress: data.customer_address,
        paymentMethod: data.payment_method,
        notes: data.notes,
        items: snapshotItems,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shipping_cost,
        total: orderData.total,
      });

      clearCart();
      setConfirmed({
        ...orderData,
        whatsappUrl,
        persisted,
      });
    } catch {
      setError("Error de conexión al registrar el pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-canvas p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de pedido"
          className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {confirmed ? (
          <div className="py-4 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface text-rose-gold-deep">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-dusty-rose">
                Pedido Registrado
              </p>
              <h2
                id="checkout-title"
                className="font-display text-4xl font-medium text-ink"
              >
                ¡Gracias por tu pedido!
              </h2>
              <p className="text-sm text-ink-soft">
                Tu número de referencia es{" "}
                <strong className="font-semibold text-ink">
                  {confirmed.order_number}
                </strong>
                . Total: <strong>{formatCOP(confirmed.total)}</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface/65 p-4 text-xs leading-relaxed text-ink-soft">
              Envía tu resumen directamente a nuestro WhatsApp oficial para
              confirmar disponibilidad, coordinar el pago y despachar tu envío.
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={confirmed.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar Pedido por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs uppercase tracking-[0.18em] text-ink-soft hover:text-ink cursor-pointer"
              >
                Seguir explorando la colección
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pr-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-dusty-rose">
                Finalizar Pedido
              </p>
              <h2
                id="checkout-title"
                className="mt-1 font-display text-3xl font-medium text-ink"
              >
                Datos para tu Envío
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                Registramos tu solicitud y te conectamos directo con nuestra asesoría por WhatsApp.
              </p>
            </div>

            {/* Compact Summary */}
            <div className="rounded-2xl border border-line bg-surface/60 p-4 text-xs space-y-1.5">
              {items.map((item) => (
                <div key={item.key} className="flex justify-between gap-2 text-ink">
                  <span className="truncate">
                    {item.quantity}× {item.product_name} ({item.color_name}, {item.size})
                  </span>
                  <span className="font-semibold shrink-0">
                    {formatCOP(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 mt-2 font-semibold text-sm text-ink">
                <span>Total</span>
                <span>{formatCOP(totals.total)}</span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-dusty-rose bg-dusty-rose/10 px-4 py-3 text-xs font-medium text-dusty-rose-deep"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="co-name"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  Nombre completo *
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Valentina Morales"
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-phone"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  WhatsApp / Celular *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 310 000 0000"
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-city"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  Ciudad / Departamento *
                </label>
                <input
                  id="co-city"
                  type="text"
                  required
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="Ej: Pasto, Nariño"
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="co-address"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  Dirección de entrega *
                </label>
                <input
                  id="co-address"
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Calle / Carrera, Barrio, Apto o Casa"
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="co-payment"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  Medio de pago preferido
                </label>
                <select
                  id="co-payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink focus:border-rose-gold-deep focus:outline-none"
                >
                  <option>Transferencia Bancolombia / Nequi</option>
                  <option>Daviplata / Bre-B</option>
                  <option>Contraentrega (según ciudad)</option>
                  <option>Acordar por WhatsApp</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="co-notes"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-1.5"
                >
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="co-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Indicaciones de entrega o consulta de tallas..."
                  className="w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-rose-gold-deep disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando Pedido...</span>
                </>
              ) : (
                <span>Confirmar Pedido · {formatCOP(totals.total)}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
