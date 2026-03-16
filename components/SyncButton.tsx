"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

interface SyncButtonProps {
  onSync: () => Promise<void>;
}

export function SyncButton({ onSync }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      await onSync();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleSync} disabled={loading}>
      <svg
        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? "Sincronizando..." : "Actualizar"}
    </Button>
  );
}
