import Markdown from "react-markdown";

export function MarkdownProcessor({ content }: { content: string }) {
  return (
    <div className="text-emerald-50 [&_p]:mb-4 [&_p]:leading-relaxed [&_code]:text-emerald-300 [&_code]:bg-emerald-950/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-emerald-950/40 [&_pre]:border [&_pre]:border-emerald-500/20 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_a]:text-emerald-400 [&_a]:hover:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-emerald-200">
      <Markdown>{content}</Markdown>
    </div>
  );
}
