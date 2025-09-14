"use client";

export default function DungeonsLayout({ children }: { children: React.ReactNode }) {
  // This layout is intentionally a passthrough. The /game/layout.tsx provides the persistent GameLayout.
  return <>{children}</>;
}
