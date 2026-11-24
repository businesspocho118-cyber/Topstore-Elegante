import type { Metadata } from "next";
import { AdminGate } from "@/features/admin/AdminGate";

export const metadata: Metadata = {
  title: "Panel Privado | TOPSTORE WOMAN",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminGate />;
}
