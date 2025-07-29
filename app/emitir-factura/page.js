"use client";
import { Suspense } from "react";
import EmitirFactura from "@/components/EmitirFactura";

export default function EmitirFacturaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmitirFactura />
    </Suspense>
  );
}
