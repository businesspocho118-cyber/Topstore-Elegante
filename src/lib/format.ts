import type { CartItem } from "./types";

export function formatCOP(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const formatted = safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${formatted} COP`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateOrderTotals(
  items: ReadonlyArray<{ unit_price: number; quantity: number }>,
  shippingCost = 0
): { subtotal: number; shipping_cost: number; total: number } {
  const subtotal = items.reduce(
    (acc, item) => acc + Math.max(0, item.unit_price) * Math.max(0, item.quantity),
    0
  );
  const safeShipping = Math.max(0, Math.round(shippingCost));
  return {
    subtotal,
    shipping_cost: safeShipping,
    total: subtotal + safeShipping,
  };
}

export function sanitizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }
  return digits || "573205172484";
}

export function buildWhatsAppOrderUrl(params: {
  storePhone: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  customerAddress: string;
  paymentMethod: string;
  notes?: string;
  items: ReadonlyArray<Pick<CartItem, "product_name" | "color_name" | "size" | "quantity" | "unit_price">>;
  subtotal: number;
  shippingCost: number;
  total: number;
}): string {
  const phone = sanitizeWhatsAppNumber(params.storePhone);
  const lines = [
    `Hola TOPSTORE WOMAN, quiero confirmar mi pedido *${params.orderNumber}*:`,
    "",
    ...params.items.map(
      (item, idx) =>
        `${idx + 1}. ${item.product_name} · Color: ${item.color_name} · Talla: ${item.size} × ${item.quantity} — ${formatCOP(
          item.unit_price * item.quantity
        )}`
    ),
    "",
    `Subtotal: ${formatCOP(params.subtotal)}`,
    params.shippingCost > 0
      ? `Envío: ${formatCOP(params.shippingCost)}`
      : "Envío: Por confirmar según ciudad",
    `*Total: ${formatCOP(params.total)}*`,
    "",
    `Clienta: ${params.customerName}`,
    params.customerCity ? `Ciudad: ${params.customerCity}` : null,
    params.customerAddress ? `Dirección: ${params.customerAddress}` : null,
    `Medio de pago: ${params.paymentMethod}`,
    params.notes ? `Notas: ${params.notes}` : null,
  ].filter((line): line is string => line !== null);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildWhatsAppInquiryUrl(
  storePhone: string,
  productName: string,
  colorName: string,
  size?: string
): string {
  const phone = sanitizeWhatsAppNumber(storePhone);
  const sizePart = size ? `, talla ${size}` : "";
  const message = `Hola TOPSTORE WOMAN, me interesa la prenda "${productName}" en color ${colorName}${sizePart}. ¿Me puedes dar más información?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
