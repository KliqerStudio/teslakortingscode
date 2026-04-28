"use client";

import { Check, Copy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { dealPath } from "@/lib/site";

type CopyReferralButtonProps = {
  compact?: boolean;
  shortLabel?: boolean;
};

export function CopyReferralButton({ compact, shortLabel }: CopyReferralButtonProps) {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");
  const copyLabel = isEnglish ? "Copy deal link" : "Kopieer deal-link";
  const copiedLabel = isEnglish ? "Deal link copied" : "Deal-link gekopieerd";
  const shortCopyLabel = isEnglish ? "Copy" : "Kopieer";
  const shortCopiedLabel = isEnglish ? "Copied" : "Gekopieerd";

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyReferralLink() {
    setCopied(true);
    let copiedToClipboard = false;
    const dealLink = `${window.location.origin}${dealPath}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await Promise.race([
          navigator.clipboard.writeText(dealLink),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("Clipboard write timed out")), 800);
          })
        ]);
        copiedToClipboard = true;
      }
    } catch {
      copiedToClipboard = false;
    }

    if (!copiedToClipboard) {
      const textarea = document.createElement("textarea");
      textarea.value = dealLink;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  return (
    <button
      type="button"
      onClick={copyReferralLink}
      aria-live="polite"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 text-sm font-semibold text-white backdrop-blur-xl transition duration-200 hover:border-white/30 hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
        compact ? "w-full sm:w-auto" : ""
      }`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
      {copied ? (shortLabel ? shortCopiedLabel : copiedLabel) : shortLabel ? shortCopyLabel : copyLabel}
    </button>
  );
}
