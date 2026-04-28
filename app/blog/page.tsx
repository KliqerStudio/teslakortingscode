import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { blogPosts } from "@/data/blogs";
import { absoluteUrl, dealPath } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla FSD Nederland blog",
  description:
    "Actuele Nederlandse gidsen over Tesla FSD Supervised, RDW-goedkeuring, kosten, Autopilot en bestellen in Nederland.",
  alternates: {
    canonical: absoluteUrl("/blog")
  },
  openGraph: {
    title: "Tesla FSD Nederland blog",
    description: "SEO-gidsen over Tesla Full Self-Driving Supervised in Nederland.",
    url: absoluteUrl("/blog")
  }
};

export default function BlogIndexPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
              Tesla FSD Nederland: gidsen voor kopers
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Actuele, bronvermelde artikelen over Full Self-Driving (Supervised), RDW-goedkeuring, kosten en praktische
              aandachtspunten voor Tesla-kopers in Nederland.
            </p>
            <ButtonLink href={dealPath} className="mt-8">
              Open Tesla deal
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-red-300/35"
              >
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={post.date}>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date(post.date))}</time>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold leading-tight text-white">
                  <Link href={`/blog/${post.slug}`} className="transition hover:text-red-100">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-4 text-base leading-7 text-zinc-300">{post.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-zinc-300">
                      {keyword}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-6 inline-flex items-center text-sm font-semibold text-red-100 transition hover:text-white"
                >
                  Lees artikel
                  <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
