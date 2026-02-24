"use client";

import React, { createContext, useContext, useMemo } from "react";

type Ctx = {
  slug?: string;
  base: string; // "" or "/<slug>"
  href: (path: string) => string;
};

const TenantCtx = createContext<Ctx | null>(null);

export function TenantProvider({
  slug,
  children,
}: {
  slug?: string;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const base = slug ? `/${slug}` : "";
    const href = (path: string) => {
      if (/^https?:\/\//i.test(path)) return path;
      const clean = path.startsWith("/") ? path : `/${path}`;
      return base ? `${base}${clean}` : clean;
    };
    return { slug, base, href };
  }, [slug]);

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantCtx);
  if (!ctx) {
    return {
      slug: undefined as string | undefined,
      base: "",
      href: (path: string) => (path.startsWith("/") ? path : `/${path}`),
    };
  }
  return ctx;
}