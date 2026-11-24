"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MessageCircle,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCOP, sanitizeWhatsAppNumber } from "@/lib/format";
import { ManualOrderModal } from "./ManualOrderModal";
import type {
  OrderStatus,
  OrderWithItems,
  ProductWithVariants,
} from "@/lib/types";

interface OrdersPanelProps {
  orders: OrderWithItems[];
  products: ProductWithVariants[];
  onOrdersChanged: () => Promise<void>;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; style: string }[] = [
  {
    value: "pendiente",
    label: "Pendiente",
    style: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    value: "confirmado",
    label: "Confirmado",
    style: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    value: "enviado",
    label: "Enviado",
    style: "bg-purple-100 text-purple-900 border-purple-200",
  },
  {
    value: "entregado",
    label: "Entregado",
    style: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    style: "bg-rose-100 text-rose-900 border-rose-200",
  },
];

export function OrdersPanel({
  orders,
  products,
  onOrdersChanged,
}: OrdersPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(
    orders[0]?.id ?? null
  );
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "todos" && order.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.toLowerCase().includes(q) ||
        order.customer_city.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setBusyOrderId(orderId);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("woman_orders")
        .update({ status })
        .eq("id", orderId);
      await onOrdersChanged();
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleSaveLogistics = async (order: OrderWithItems) => {
    setBusyOrderId(order.id);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("woman_orders")
        .update({
          tracking_code:
            trackingDrafts[order.id] ?? order.tracking_code ?? null,
          notes: notesDrafts[order.id] ?? order.notes ?? "",
        })
        .eq("id", order.id);
      await onOrdersChanged();
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDeleteOrder = async (order: OrderWithItems) => {
    if (
      !window.confirm(
        `¿Eliminar el pedido ${order.order_number} de ${order.customer_name}?`
      )
    ) {
      return;
    }
    setBusyOrderId(order.id);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("woman_orders").delete().eq("id", order.id);
      await onOrdersChanged();
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, teléfono, ciudad o #TSW..."
              className="w-full min-h-[44px] rounded-full border border-line-strong bg-card pl-10 pr-4 text-xs text-ink placeholder:text-ink-muted focus:border-rose-gold-deep focus:outline-none"
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] rounded-full border border-line-strong bg-card px-4 text-xs font-medium text-ink focus:border-rose-gold-deep focus:outline-none"
          >
            <option value="todos">Todos los estados</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setManualModalOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-line bg-card py-16 text-center space-y-2">
          <p className="font-display text-2xl text-ink">
            No hay pedidos registrados aún
          </p>
          <p className="text-xs text-ink-soft">
            Los pedidos enviados desde el catálogo aparecerán aquí, o puedes crear uno manualmente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const statusMeta =
              STATUS_OPTIONS.find((s) => s.value === order.status) ??
              STATUS_OPTIONS[0];
            const trackingValue =
              trackingDrafts[order.id] ?? order.tracking_code ?? "";
            const notesValue = notesDrafts[order.id] ?? order.notes ?? "";
            const customerWa = `https://wa.me/${sanitizeWhatsAppNumber(
              order.customer_phone
            )}?text=${encodeURIComponent(
              `Hola ${order.customer_name}, te escribimos de TOPSTORE WOMAN sobre tu pedido ${order.order_number}.`
            )}`;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-line bg-card overflow-hidden transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-ink">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.style}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-soft">
                        {order.source}
                      </span>
                    </div>
                    <p className="font-display text-xl font-semibold text-ink">
                      {order.customer_name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {order.customer_phone} · {order.customer_city || "Sin ciudad"} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-sm font-bold text-ink">
                        {formatCOP(order.total)}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {order.items.length} ítem(s)
                      </p>
                    </div>

                    <select
                      aria-label={`Estado de ${order.order_number}`}
                      disabled={busyOrderId === order.id}
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      className="min-h-[40px] rounded-xl border border-line-strong bg-canvas px-3 text-xs font-medium text-ink cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.id)
                      }
                      aria-label="Ver detalles del pedido"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line hover:bg-surface cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line bg-canvas/60 p-5 space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Shipping & Payment Info */}
                      <div className="rounded-xl border border-line bg-card p-4 text-xs space-y-1.5">
                        <p className="font-semibold uppercase tracking-[0.14em] text-dusty-rose mb-2">
                          Datos de Envío
                        </p>
                        <p>
                          <strong>Dirección:</strong>{" "}
                          {order.customer_address || "No especificada"}
                        </p>
                        <p>
                          <strong>Ciudad:</strong> {order.customer_city || "—"}
                        </p>
                        <p>
                          <strong>Pago:</strong> {order.payment_method}
                        </p>
                        <p>
                          <strong>Subtotal:</strong> {formatCOP(order.subtotal)} ·{" "}
                          <strong>Envío:</strong> {formatCOP(order.shipping_cost)}
                        </p>
                      </div>

                      {/* Items */}
                      <div className="rounded-xl border border-line bg-card p-4 text-xs space-y-2">
                        <p className="font-semibold uppercase tracking-[0.14em] text-dusty-rose">
                          Prendas Solicitadas
                        </p>
                        <ul className="space-y-1.5">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5 last:border-none last:pb-0"
                            >
                              <span>
                                <strong>{item.quantity}×</strong> {item.product_name}{" "}
                                <span className="text-ink-soft">
                                  ({item.color_name} · Talla {item.size})
                                </span>
                              </span>
                              <span className="font-semibold shrink-0">
                                {formatCOP(item.line_total)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Tracking & Notes */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft mb-1">
                          Número de guía / Transportadora
                        </label>
                        <input
                          type="text"
                          value={trackingValue}
                          onChange={(e) =>
                            setTrackingDrafts((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          placeholder="Ej: Servientrega #2049581"
                          className="w-full min-h-[40px] rounded-xl border border-line-strong bg-card px-3 text-xs text-ink"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft mb-1">
                          Notas del pedido
                        </label>
                        <input
                          type="text"
                          value={notesValue}
                          onChange={(e) =>
                            setNotesDrafts((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          placeholder="Observaciones internas..."
                          className="w-full min-h-[40px] rounded-xl border border-line-strong bg-card px-3 text-xs text-ink"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => handleSaveLogistics(order)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Guardar Guía / Notas</span>
                        </button>

                        <a
                          href={customerWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line-strong bg-card px-4 py-2 text-xs font-medium text-ink hover:border-rose-gold-deep transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-dusty-rose" />
                          <span>Escribir por WhatsApp</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => handleDeleteOrder(order)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-dusty-rose-deep hover:bg-dusty-rose/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {manualModalOpen && (
        <ManualOrderModal
          products={products}
          onClose={() => setManualModalOpen(false)}
          onCreated={async () => {
            setManualModalOpen(false);
            await onOrdersChanged();
          }}
        />
      )}
    </div>
  );
}
