/**
 * Candidate AI Copilot
 * Floating chat assistant for the candidate portal.
 * Uses Vercel AI SDK useChat with DefaultChatTransport
 * Streams to /api/assistant/chat/candidate/stream
 * Cookie-based auth (credentials: "include")
 */

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Sparkles,
  X,
  ArrowUp,
  Plus,
  Loader2,
  Briefcase,
  Search,
  CalendarCheck,
  UserCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const STREAM_ENDPOINT = "/api/assistant/chat/candidate/stream";
const STORAGE_KEY = "candidate-ai-copilot-messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content?: string;
  parts?: Array<Record<string, unknown>>;
  toolInvocations?: ToolInvocation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** AI SDK v4/v5 may put tools on `parts` instead of legacy `toolInvocations`. */
function getMessageToolInvocations(message: ChatMessage): ToolInvocation[] {
  const direct = message.toolInvocations;
  if (Array.isArray(direct) && direct.length > 0) return direct;

  const parts = message.parts;
  if (!Array.isArray(parts)) return [];

  const out: ToolInvocation[] = [];
  for (const raw of parts) {
    if (!raw || typeof raw !== "object") continue;
    const part = raw as Record<string, unknown>;
    const inv = part.toolInvocation;
    if (part.type === "tool-invocation" && inv && typeof inv === "object") {
      out.push(inv as ToolInvocation);
      continue;
    }
    const type = part.type;
    if (
      typeof type === "string" &&
      type.startsWith("tool-") &&
      typeof part.toolCallId === "string"
    ) {
      const state = part.state;
      if (state === "partial-call" || state === "call" || state === "result") {
        out.push({
          toolCallId: part.toolCallId as string,
          toolName: type.slice("tool-".length),
          args: (part.args as Record<string, unknown>) ?? {},
          state,
          result: part.result,
        });
      }
    }
  }
  return out;
}

function renderText(message: ChatMessage): string {
  if (typeof message.content === "string" && message.content.trim()) {
    return message.content;
  }
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts
    .filter((part) => part?.type === "text" && typeof part?.text === "string")
    .map((part) => part.text as string)
    .join("\n");
}

/** Lightweight inline markdown → React elements (no external deps). */
function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: ReactNode[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuffer) return;
    if (listBuffer.ordered) {
      elements.push(
        <ol key={key++} className="my-1 list-decimal pl-5 space-y-0.5">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key++} className="my-1 list-disc pl-5 space-y-0.5">
          {listBuffer.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    listBuffer = null;
  };

  /** Parse inline markdown: **bold** and *italic* */
  const parseInline = (raw: string): ReactNode => {
    const parts: ReactNode[] = [];
    let remaining = raw;
    let inlineKey = 0;
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={inlineKey++}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={inlineKey++}>{match[3]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex));
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2]);
      if (level === 1) elements.push(<h3 key={key++} className="text-[14px] font-bold mt-2 mb-1">{content}</h3>);
      else if (level === 2) elements.push(<h4 key={key++} className="text-[13px] font-bold mt-2 mb-1">{content}</h4>);
      else elements.push(<h5 key={key++} className="text-[13px] font-semibold mt-1.5 mb-0.5">{content}</h5>);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (listBuffer && listBuffer.ordered) flushList();
      if (!listBuffer) listBuffer = { ordered: false, items: [] };
      listBuffer.items.push(parseInline(ulMatch[1]));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (listBuffer && !listBuffer.ordered) flushList();
      if (!listBuffer) listBuffer = { ordered: true, items: [] };
      listBuffer.items.push(parseInline(olMatch[1]));
      continue;
    }

    // Flush any pending list before non-list content
    flushList();

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Normal paragraph
    elements.push(<p key={key++} className="my-0">{parseInline(line)}</p>);
  }

  flushList();
  return elements;
}

/** Convert snake_case tool name to Title Case */
function formatToolName(toolName: string): string {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** CSS-only text shimmer (no framer-motion dependency) */
function TextShimmer({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent animate-shimmer ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #71717a 40%, #ffffff 50%, #71717a 60%)",
        backgroundSize: "250% 100%",
      }}
    >
      {children}
    </span>
  );
}

/** Thinking indicator */
function ThinkingLoader() {
  return (
    <div className="w-full max-w-[95%] mr-auto py-1 px-1">
      <TextShimmer className="text-xs font-medium">Thinking...</TextShimmer>
    </div>
  );
}

/** Tool invocation display — shimmers while running, settles when done */
function ToolInvocationDisplay({ invocation }: { invocation: ToolInvocation }) {
  const { toolName, state } = invocation;
  const displayName = formatToolName(toolName);
  const isDone = state === "result";

  return (
    <div className="mb-1 py-0">
      <div className="flex items-center gap-1">
        <span
          className={[
            "h-1 w-1 rounded-full shrink-0 transition-colors duration-700",
            isDone
              ? "bg-muted-foreground/25"
              : "bg-muted-foreground/50 animate-pulse",
          ].join(" ")}
        />
        {isDone ? (
          <span className="text-[10px] font-medium text-muted-foreground/40">
            {displayName}
          </span>
        ) : (
          <TextShimmer className="text-[10px] font-medium">
            {displayName}
          </TextShimmer>
        )}
      </div>
    </div>
  );
}

/** Suggested prompt card */
function PromptCard({
  icon,
  text,
  onClick,
}: {
  icon: ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-left text-[12px] leading-snug text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border transition-all"
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground/60">{icon}</span>
      <span>{text}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CandidateAiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ---- Load persisted messages ----
  const initialMessages = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  }, []);

  // ---- Chat transport ----
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_BASE_URL}${STREAM_ENDPOINT}`,
        credentials: "include",
      }),
    []
  );

  const { messages, status, stop, setMessages, sendMessage } = useChat({
    id: STORAGE_KEY,
    transport,
    messages: initialMessages,
  });

  // ---- Persist messages ----
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [messages]);

  const chatMessages = useMemo(
    () => messages as unknown as ChatMessage[],
    [messages]
  );
  const isStreaming = status === "submitted" || status === "streaming";

  // ---- Auto-scroll ----
  const lastUserMessageId = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].role === "user") return chatMessages[i].id;
    }
    return null;
  }, [chatMessages]);

  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (lastUserMessageId && lastUserMessageRef.current) {
      setTimeout(() => {
        lastUserMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  }, [lastUserMessageId]);

  // ---- Focus input when panel opens ----
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ---- Handlers ----
  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isStreaming) return;
      setInput("");
      sendMessage({ text });
    },
    [input, isStreaming, sendMessage]
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      sendMessage({ text: prompt });
    },
    [isStreaming, sendMessage]
  );

  const handleNewChat = useCallback(() => {
    if (isStreaming) stop();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [isStreaming, stop, setMessages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ---- Suggested prompts ----
  const suggestedPrompts = [
    {
      icon: <Briefcase className="h-3.5 w-3.5" />,
      text: "What's the status of my applications?",
    },
    {
      icon: <CalendarCheck className="h-3.5 w-3.5" />,
      text: "Help me prepare for my upcoming interview",
    },
    {
      icon: <Search className="h-3.5 w-3.5" />,
      text: "Search for jobs matching my profile",
    },
    {
      icon: <UserCircle className="h-3.5 w-3.5" />,
      text: "Review my profile and suggest improvements",
    },
  ];

  const isEmpty = chatMessages.length === 0;

  // ---- Render ----
  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
        ].join(" ")}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(600px,calc(100vh-120px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNewChat}
                  title="New conversation"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 px-3" ref={scrollRef}>
            <div className="py-3 space-y-3">
              {isEmpty ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-8 px-2">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold">Hi there!</h3>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    I can help with your applications, interviews, job search,
                    and more.
                  </p>
                  <div className="mt-6 grid w-full gap-2">
                    {suggestedPrompts.map((p) => (
                      <PromptCard
                        key={p.text}
                        icon={p.icon}
                        text={p.text}
                        onClick={() => handlePromptClick(p.text)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Message list */
                chatMessages.map((msg) => {
                  if (msg.role !== "user" && msg.role !== "assistant")
                    return null;

                  const text = renderText(msg);
                  const tools = getMessageToolInvocations(msg);
                  const isUser = msg.role === "user";
                  const isLastUser = msg.id === lastUserMessageId;

                  return (
                    <div
                      key={msg.id}
                      ref={isLastUser ? lastUserMessageRef : undefined}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted/60 text-foreground rounded-bl-sm",
                        ].join(" ")}
                      >
                        {/* Tool invocations */}
                        {tools.length > 0 && (
                          <div className="mb-1">
                            {tools.map((inv) => (
                              <ToolInvocationDisplay
                                key={inv.toolCallId}
                                invocation={inv}
                              />
                            ))}
                          </div>
                        )}

                        {/* Message text */}
                        {text && (
                          isUser
                            ? <p className="whitespace-pre-wrap">{text}</p>
                            : <div className="space-y-0.5">{renderMarkdown(text)}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Streaming indicator */}
              {isStreaming &&
                (chatMessages.length === 0 ||
                  chatMessages[chatMessages.length - 1]?.role !== "assistant" ||
                  !renderText(
                    chatMessages[chatMessages.length - 1]
                  ).trim()) && <ThinkingLoader />}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border/60 px-3 py-2.5">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 max-h-24 scrollbar-thin"
                style={{ minHeight: "36px" }}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
                disabled={!input.trim() || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </form>
            {isStreaming && (
              <button
                type="button"
                onClick={stop}
                className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Stop generating
              </button>
            )}
          </div>
        </div>
      )}

      {/* Shimmer keyframes via inline style tag */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 105% center; }
          100% { background-position: -5% center; }
        }
        .animate-shimmer {
          animation: shimmer 1.8s linear infinite;
        }
      `}</style>
    </>
  );
}
