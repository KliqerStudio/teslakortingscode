import { ArrowUpRight, Home } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-28 pt-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-300">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">Pagina niet gevonden</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-zinc-400">
        De pagina die u zoekt bestaat niet of is verplaatst. Gebruik de Tesla referral link direct via de homepage.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">
          <Home className="mr-2 h-4 w-4" />
          Terug naar home
        </ButtonLink>
        <ButtonLink href="/tesla-kortingscode" variant="secondary">
          Tesla kortingscode
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>
    </main>
  );
}
