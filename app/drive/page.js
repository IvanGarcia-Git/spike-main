"use client";

import DriveClient from "@/components/drive/DriveClient";
import { Suspense } from "react";

export default function Drive() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DriveClient />
    </Suspense>
  );
}