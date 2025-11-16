import Navbar from "@/components/navbar";
import { renderLegalMarkdown } from "@/lib/renderMarkdown";
import Image from "next/image";
import Link from "next/link";

// MIGRATED: Removed incompatible Route Segment Config exports
// - Removed: export const dynamic = "error"
// - Removed: export const revalidate = false
// Migration: Added "use cache" directive to preserve static behavior
// Legal content rarely changes, so caching is appropriate

export const metadata = {
  title: "Terms of Service",
  description: "The terms governing use of Lexicon Flow.",
};

export default async function Page() {
  "use cache";
  const html = await renderLegalMarkdown("Service_Level_Agreement.md");
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
        <article
          className="
          prose
          prose-lg
          prose-headings:font-semibold
          prose-headings:text-gray-100
          prose-p:text-gray-200
          prose-strong:text-gray-100
          prose-a:text-blue-400
          prose-a:no-underline hover:prose-a:underline
          prose-li:marker:text-gray-400
          prose-invert
          leading-relaxed
        "
          dangerouslySetInnerHTML={{ __html: html }}
          />
        <nav className="flex justify-between mt-12">
          <Link
            href="/legal/terms"
            className="px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            ← Terms of Service
          </Link>
          <Link
            href="/legal/use"
            className="px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            Acceptable Use →
          </Link>
        </nav>
      </main>
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image src="/logo.svg" alt="Logo" width={40} height={40} />
              <span className="text-xl font-bold">Lexicon Flow</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2025 Lexicon Flow LLC. All rights reserved.</span>
              <Link href="/legal/terms">Legal Notices</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
