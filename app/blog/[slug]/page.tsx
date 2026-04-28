import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, FileText } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts, blogUrl, getBlogPost } from "@/data/blogs";
import { absoluteUrl, dealPath, legalDisclaimerNl, termsUrl } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`)
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.date,
      modifiedTime: post.updated
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: "nl-NL",
    mainEntityOfPage: blogUrl(post.slug),
    author: {
      "@type": "Organization",
      name: "TeslaKortingscode.com"
    },
    publisher: {
      "@type": "Organization",
      name: "TeslaKortingscode.com"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <main className="pb-28 pt-28">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <article className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-zinc-300 transition hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Terug naar FSD blog
          </Link>

          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <time dateTime={post.date}>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date(post.date))}</time>
              </span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-6xl">{post.title}</h1>
            <p className="mt-6 text-xl leading-9 text-zinc-300">{post.intro}</p>
          </header>

          <div className="mt-10 flex flex-col gap-3 rounded-[1.75rem] border border-red-300/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-red-50">
              Bestelt u binnenkort een Tesla? Controleer de deal-link en officiële voorwaarden voordat u de order afrondt.
            </p>
            <ButtonLink href={dealPath} className="flex-none">
              Open Tesla deal
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <div className="mt-12 space-y-12">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-3xl font-semibold text-white">{section.heading}</h2>
                <div className="mt-5 space-y-5">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-lg leading-8 text-zinc-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-14">
            <h2 className="text-3xl font-semibold text-white">Veelgestelde vragen</h2>
            <div className="mt-6 space-y-3">
              {post.faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                  <summary className="cursor-pointer list-none font-semibold text-white">{faq.question}</summary>
                  <p className="mt-4 text-base leading-7 text-zinc-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6">
            <h2 className="flex items-center text-2xl font-semibold text-white">
              <FileText className="mr-3 h-5 w-5 text-red-200" aria-hidden="true" />
              Bronnen en verdere controle
            </h2>
            <ul className="mt-5 space-y-3">
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-300 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Tesla referral voorwaarden
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm leading-6 text-zinc-400">{legalDisclaimerNl}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
