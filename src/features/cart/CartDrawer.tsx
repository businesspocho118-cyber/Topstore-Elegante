"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { useCartStore } from "./useCartStore";
import { CheckoutModal } from "./CheckoutModal";
import { calculateOrderTotals, formatCOP } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

interface CartDrawerProps {
  settings: StoreSettings;
}

export function CartDrawer({ settings }: CartDrawerProps) {
  const { items, isOpen, closeCart, updateQuantity, removeItem } =
    useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const totals = calculateOrderTotals(items, settings.default_shipping_cost);

  if (!isOpen && !checkoutOpen) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bolsa de compra"
          className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-xs"
          onClick={closeCart}
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-canvas border-l border-line shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-rose-gold-deep" />
                <h2 className="font-display text-2xl font-medium text-ink">
                  Tu Bolsa
                </h2>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Cerrar bolsa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-rose-gold-deep">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-2xl text-ink">
                      Tu bolsa está vacía
                    </p>
                    <p className="text-xs text-ink-soft max-w-xs">
                      Explora nuestra colección elegante y elige tus prendas favoritas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
                  >
                    Ver Colección
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex gap-4 rounded-2xl border border-line bg-card p-3.5"
                    >
                      <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-xl bg-surface">
                        <Image
                          src={item.image_url || "/media/logo.jpeg"}
                          alt={item.product_name}
                          fill
                          sizes="72px"
                          className="object-cover object-top"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-lg font-medium text-ink leading-tight truncate">
                              {item.product_name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-ink/20"
                                style={{ backgroundColor: item.color_hex }}
                              />
                              <span className="truncate">{item.color_name}</span>
                              <span>·</span>
                              <span className="font-medium text-ink">
                                Talla {item.size}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Quitar ${item.product_name}`}
                            className="p-1.5 text-ink-muted hover:text-dusty-rose transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-line bg-canvas">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.key, item.quantity - 1)
                              }
                              aria-label="Restar unidad"
                              className="inline-flex h-8 w-8 items-center justify-center text-ink hover:text-rose-gold-deep cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.key, item.quantity + 1)
                              }
                              aria-label="Sumar unidad"
                              className="inline-flex h-8 w-8 items-center justify-center text-ink hover:text-rose-gold-deep cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-semibold text-ink">
                            {formatCOP(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer Totals */}
            {items.length > 0 && (
              <div className="border-t border-line bg-surface/60 px-6 py-5 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-ink-soft">
                    <span>Subtotal</span>
                    <span>{formatCOP(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft text-xs">
                    <span>Envío nacional</span>
                    <span>
                      {totals.shipping_cost > 0
                        ? formatCOP(totals.shipping_cost)
                        : "Por confirmar al coordinar"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-line text-base font-semibold text-ink">
                    <span>Total estimado</span>
                    <span>{formatCOP(totals.total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    setCheckoutOpen(true);
                  }}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
                >
                  <span>Realizar Pedido</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <CheckoutModal
          settings={settings}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}
