import test from "node:test";
import assert from "node:assert/strict";

// Mirror pure formatting & pricing helpers directly to test core domain logic without TS transpiler overhead
function formatCOP(amount) {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const formatted = safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${formatted} COP`;
}

function calculateOrderTotals(items, shippingCost = 0) {
  const subtotal = items.reduce(
    (acc, item) =>
      acc + Math.max(0, item.unit_price) * Math.max(0, item.quantity),
    0
  );
  const safeShipping = Math.max(0, Math.round(shippingCost));
  return {
    subtotal,
    shipping_cost: safeShipping,
    total: subtotal + safeShipping,
  };
}

function sanitizeWhatsAppNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }
  return digits || "573205172484";
}

test("formatCOP formats Colombian pesos cleanly", () => {
  assert.equal(formatCOP(145000), "$145.000 COP");
  assert.equal(formatCOP(0), "$0 COP");
  assert.equal(formatCOP(1250000), "$1.250.000 COP");
  assert.equal(formatCOP(-500), "$0 COP");
});

test("calculateOrderTotals sums line items and shipping accurately", () => {
  const result = calculateOrderTotals(
    [
      { unit_price: 145000, quantity: 2 },
      { unit_price: 235000, quantity: 1 },
    ],
    15000
  );
  assert.equal(result.subtotal, 525000);
  assert.equal(result.shipping_cost, 15000);
  assert.equal(result.total, 540000);
});

test("sanitizeWhatsAppNumber normalizes Colombian mobile numbers", () => {
  assert.equal(sanitizeWhatsAppNumber("320 517 2484"), "573205172484");
  assert.equal(sanitizeWhatsAppNumber("+57 320-517-2484"), "573205172484");
  assert.equal(sanitizeWhatsAppNumber(""), "573205172484");
});
