"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function LanguageDocument() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname.startsWith("/en") ? "en" : "nl";
  }, [pathname]);

  return null;
}
