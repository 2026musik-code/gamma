import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Info, TerminalSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { MarkdownProcessor } from "./MarkdownProcessor";

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content:
        "Hello. I am AI GAMMA 4. I am initialized and ready to assist you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: modelMessageId, role: "model", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          const lines = chunkString.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                // Cloudflare Workers AI streams return { response: "..." }
                // Local mock returns { text: "..." }
                const messageText = parsed.response || parsed.text;
                if (messageText) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? { ...msg, content: msg.content + messageText }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMessageId
            ? {
                ...msg,
                content:
                  msg.content +
                  `\n\n**SYSTEM ERROR:** ${
                    error.message || "An unexpected error occurred."
                  }`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-black border border-emerald-900/30 shadow-2xl shadow-emerald-900/10 rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/20 border-b border-emerald-900/30">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20">
            <TerminalSquare className="w-5 h-5 text-emerald-400" />
            <div className="absolute top-0 right-0 w-2 h-2 translate-x-1 -translate-y-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(16,185,129,0.5)]"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-emerald-50 uppercase">
              AI GAMMA 4
            </h1>
            <p className="text-xs text-emerald-500/70 font-mono tracking-widest uppercase">
              System Online
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-900/30">
          <Info className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-400">
            Hono / Cloudflare Ready
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-black to-emerald-950/10 custom-scrollbar"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4",
                message.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm shadow-lg shadow-emerald-900/20"
                  : "bg-emerald-950/40 border border-emerald-800/30 text-emerald-50 rounded-bl-sm"
              )}
            >
              {message.role === "model" ? (
                <MarkdownProcessor content={message.content} />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-sm font-mono tracking-wider text-emerald-500/70 uppercase">
                Processing...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-black border-t border-emerald-900/30">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center w-full bg-emerald-950/20 border border-emerald-900/50 rounded-xl overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Awaiting input sequence..."
            className="flex-1 bg-transparent px-4 py-4 text-emerald-50 placeholder:text-emerald-500/40 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-500/50 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
