import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
};

export function ButtonLink({
  children,
  className = "",
  variant = "primary",
  external,
  ...props
}: ButtonLinkProps) {
  const styles = {
    primary:
      "bg-white text-graphite-950 shadow-glow hover:bg-zinc-100 focus-visible:outline-white",
    secondary:
      "border border-white/15 bg-white/8 text-white backdrop-blur-xl hover:border-white/30 hover:bg-white/12 focus-visible:outline-white",
    ghost:
      "border border-red-400/30 bg-red-500/10 text-white hover:bg-red-500/16 focus-visible:outline-red-300"
  };

  return (
    <a
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${styles[variant]} ${className}`}
      target={external ? "_blank" : props.target}
      rel={external ? "noopener noreferrer" : props.rel}
      {...props}
    >
      {children}
    </a>
  );
}
