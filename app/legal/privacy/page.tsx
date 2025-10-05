import Navbar from "@/components/navbar";
import { renderLegalMarkdown } from "@/lib/renderMarkdown";

export const dynamic = "error";
export const revalidate = false;

export const metadata = {
  title: "Privacy Policy",
  description: "How Lexicon Flow collects and protects user data.",
};

export default async function Page() {
  const html = await renderLegalMarkdown("Privacy_Policy.md");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
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
      </main>
    </div>
  );
}
