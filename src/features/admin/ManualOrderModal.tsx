"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { calculateOrderTotals, formatCOP } from "@/lib/format";
import type {
  OrderSource,
  OrderStatus,
  ProductWithVariants,
} from "@/lib/types";

interface ManualOrderModalProps {
  products: ProductWithVariants[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

interface DraftLine {
  productId: string;
  variantId: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export function ManualOrderModal({
  products,
  onClose,
  onCreated,
}: ManualOrderModalProps) {
  const firstProd = products[0];
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia Bancolombia / Nequi");
  const [source, setSource] = useState<OrderSource>("whatsapp");
  const [status, setStatus] = useState<OrderStatus>("confirmado");
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<DraftLine[]>(() =>
    firstProd
      ? [
          {
            productId: firstProd.id,
            variantId: firstProd.variants[0]?.id ?? "",
            size: firstProd.sizes[0] ?? "M",
            quantity: 1,
            unitPrice: firstProd.price,
          },
        ]
      : []
  );

  const totals = calculateOrderTotals(
    lines.map((l) => ({ unit_price: l.unitPrice, quantity: l.quantity })),
    shippingCost
  );

  const addLine = () => {
    if (!firstProd) return;
    setLines((prev) => [
      ...prev,
      {
        productId: firstProd.id,
        variantId: firstProd.variants[0]?.id ?? "",
        size: firstProd.sizes[0] ?? "M",
        quantity: 1,
        unitPrice: firstProd.price,
      },
    ]);
  };

  const updateLineProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              productId: prod.id,
              variantId: prod.variants[0]?.id ?? "",
              size: prod.sizes[0] ?? "M",
              quantity: line.quantity,
              unitPrice: prod.price,
            }
          : line
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Agrega al menos una prenda al pedido.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const orderNumber = `TSW-${new Date().getFullYear()}-${String(
        Math.floor(1000 + Math.random() * 9000)
      )}`;

      const { data: order, error: orderError } = await supabase
        .from("woman_orders")
        .insert({
          order_number: orderNumber,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_city: customerCity.trim(),
          customer_address: customerAddress.trim(),
          payment_method: paymentMethod,
          status,
          source,
          subtotal: totals.subtotal,
          shipping_cost: totals.shipping_cost,
          total: totals.total,
          notes: notes.trim(),
        })
        .select()
        .single();

      if (orderError || !order) {
        setError(orderError?.message || "No se pudo crear el pedido.");
        setSaving(false);
        return;
      }

      const itemsPayload = lines.map((line) => {
        const prod = products.find((p) => p.id === line.productId);
        const variant = prod?.variants.find((v) => v.id === line.variantId);
        return {
          order_id: order.id,
          product_id: prod?.id ?? null,
          variant_id: variant?.id ?? null,
          product_name: prod?.name ?? "Prenda",
          color_name: variant?.color_name ?? "Único",
          size: line.size,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          line_total: line.unitPrice * line.quantity,
          image_url: variant?.images?.[0] ?? null,
        };
      });

      const { error: itemsError } = await supabase
        .from("woman_order_items")
        .insert(itemsPayload);

      if (itemsError) {
        setError(itemsError.message);
        setSaving(false);
        return;
      }

      await onCreated();
    } catch {
      setError("Ocurrió un error al guardar el pedido.");
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crear pedido manual"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-canvas p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
              Registro Manual
            </p>
            <h2 className="font-display text-3xl font-medium text-ink">
              Nuevo Pedido
            </h2>
          </div>

          {error && (
            <div className="rounded-xl border border-dusty-rose bg-dusty-rose/10 px-4 py-3 text-xs text-dusty-rose-deep font-medium">
              {error}
            </div>
          )}

          {/* Customer fields */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Nombre clienta *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                WhatsApp / Teléfono *
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Canal de origen
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as OrderSource)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="admin">Admin / Directo</option>
                <option value="web">Web</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Estado inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Medio de pago
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Costo envío (COP)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>
          </div>

          {/* Product Lines */}
          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                Prendas del pedido
              </p>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-card px-3 py-1.5 text-xs font-medium text-ink hover:border-rose-gold-deep cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar prenda</span>
              </button>
            </div>

            {lines.map((line, index) => {
              const prod = products.find((p) => p.id === line.productId);
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2.5 rounded-2xl border border-line bg-card p-3.5 sm:grid-cols-12 items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase text-ink-soft mb-1">
                      Prenda
                    </label>
                    <select
                      value={line.productId}
                      onChange={(e) => updateLineProduct(index, e.target.value)}
                      className="w-full min-h-[38px] rounded-lg border border-line-strong bg-canvas px-2 text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.ref_code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase text-ink-soft mb-1">
                      Color
                    </label>
                    <select
                      value={line.variantId}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === index ? { ...l, variantId: e.target.value } : l
                          )
                        )
                      }
                      className="w-full min-h-[38px] rounded-lg border border-line-strong bg-canvas px-2 text-xs"
                    >
                      {(prod?.variants ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.color_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase text-ink-soft mb-1">
                      Talla
                    </label>
                    <select
                      value={line.size}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === index ? { ...l, size: e.target.value } : l
                          )
                        )
                      }
                      className="w-full min-h-[38px] rounded-lg border border-line-strong bg-canvas px-2 text-xs"
                    >
                      {(prod?.sizes ?? ["S", "M", "L"]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase text-ink-soft mb-1">
                      Cant.
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === index
                              ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) }
                              : l
                          )
                        )
                      }
                      className="w-full min-h-[38px] rounded-lg border border-line-strong bg-canvas px-2 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label="Quitar línea"
                      className="p-2 text-dusty-rose hover:text-dusty-rose-deep cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
              Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-card px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
            <div className="text-sm">
              <span className="text-ink-soft">Total del pedido: </span>
              <strong className="text-lg text-ink">
                {formatCOP(totals.total)}
              </strong>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-canvas hover:bg-rose-gold-deep disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Guardar Pedido</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
