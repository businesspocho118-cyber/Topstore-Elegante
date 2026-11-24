import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateOrderTotals } from "@/lib/format";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createSupabaseServerClient();
    const allItemsHaveUuid = data.items.every(
      (item) => uuidRegex.test(item.product_id) && uuidRegex.test(item.variant_id)
    );

    if (supabase && allItemsHaveUuid) {
      const { data: rpcData, error } = await supabase.rpc("create_woman_order", {
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
      });

      if (!error && rpcData) {
        return NextResponse.json({
          persisted: true,
          order: rpcData,
        });
      }
    }

    // Fallback when database tables are not yet seeded or running in preview mode
    const totals = calculateOrderTotals(data.items, 0);
    const fallbackNumber = `TSW-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;

    return NextResponse.json({
      persisted: false,
      order: {
        id: `local-${Date.now()}`,
        order_number: fallbackNumber,
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping_cost,
        total: totals.total,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No fue posible procesar el pedido en este momento." },
      { status: 500 }
    );
  }
}
