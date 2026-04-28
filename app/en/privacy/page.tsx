import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy statement for this independent Tesla deals guide.",
  alternates: {
    canonical: absoluteUrl("/en/privacy")
  }
};

export default function EnglishPrivacyPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Privacy</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>
              This website is a simple static deals guide. It does not provide forms and does not ask visitors for
              personal data.
            </p>
            <p>
              If analytics, tracking, cookies or contact forms are added later, this privacy statement should be updated
              before those features go live.
            </p>
            <p>
              When you click the deal link or terms link, you leave this website and go to Tesla’s official website.
              Tesla’s own privacy policy and terms then apply.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
