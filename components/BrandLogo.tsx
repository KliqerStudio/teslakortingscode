import Link from "next/link";

type BrandLogoProps = {
  href: string;
  locale?: "nl" | "en";
};

export function BrandLogo({ href, locale = "nl" }: BrandLogoProps) {
  const label = locale === "en" ? "TeslaKortingscode.com home" : "TeslaKortingscode.com home";

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      aria-label={label}
    >
      <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-red-300/35 bg-gradient-to-br from-red-500/22 via-white/8 to-white/0 shadow-glow">
        <span className="text-[0.68rem] font-black tracking-normal text-white">TK</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-400 ring-4 ring-graphite-950" />
      </span>
      <span className="hidden leading-none sm:block">
        <span className="block text-sm font-semibold text-white">TeslaKortingscode</span>
        <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-red-200/80">.com</span>
      </span>
    </Link>
  );
}
