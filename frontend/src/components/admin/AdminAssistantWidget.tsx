"use client";

import React, { useState, useRef, useEffect } from "react";
import { SUPPORTED_COMMANDS, CommandDefinition } from "@/modules/assistant/commands";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isCommand?: boolean;
  command?: string;
  timestamp: string;
}

const INITIAL_WELCOME_MESSAGE: Message = {
  id: "welcome-msg",
  sender: "assistant",
  text: `👋 **Welcome to Brightloop Admin Intelligence!**

I am your executive AI copilot. You can ask general operational questions or run live database intelligence commands:

- \`/churn\` – Subscription churn rate & attrition analysis
- \`/revenue\` – Invoiced receivables vs collected cashflow & MoM growth
- \`/subscriptions\` – Active fleet status & upcoming renewal pipeline
- \`/payments\` – Gateway performance & overdue invoices
- \`/customers\` – Customer segmentation & adoption metrics
- \`/forecast\` – 3-month MRR/ARR projections & cashflow estimates

*Tip: Type \`/\` in the box below to open command autocomplete, or click any chip.*`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

/**
 * A lightweight markdown formatter for rendering executive reports cleanly
 */
function MarkdownRenderer({ content }: { content: string }) {
  // Split into lines to format headers, lists, code blocks, and paragraphs
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="space-y-1.5 my-2 pl-4 list-disc text-gray-700">
          {listBuffer.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <InlineFormatting text={item} />
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code block start/end
    if (trimmed.startsWith("```")) {
      flushList(`pre-code-${index}`);
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-2.5 p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto border border-gray-800"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList(`pre-h3-${index}`);
      elements.push(
        <h4
          key={`h3-${index}`}
          className="text-xs font-bold text-gray-900 mt-3.5 mb-1.5 flex items-center gap-1.5 border-b border-gray-100 pb-1"
        >
          <span className="w-1.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
          <span>{trimmed.replace(/^###\s+/, "")}</span>
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`pre-h2-${index}`);
      elements.push(
        <h3 key={`h2-${index}`} className="text-sm font-bold text-[#142c26] mt-4 mb-2">
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`pre-h1-${index}`);
      elements.push(
        <h2 key={`h1-${index}`} className="text-base font-bold text-[#142c26] mt-4 mb-2">
          {trimmed.replace(/^#\s+/, "")}
        </h2>
      );
      return;
    }

    // List items (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listBuffer.push(trimmed.slice(2));
      return;
    }

    // Numbered lists (e.g. "1. ")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList(`pre-num-${index}`);
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 my-1 text-gray-700">
          <span className="font-semibold text-emerald-800 text-[11px] shrink-0 mt-0.5">
            {numMatch[1]}.
          </span>
          <span className="leading-relaxed">
            <InlineFormatting text={numMatch[2]} />
          </span>
        </div>
      );
      return;
    }

    // Flush any pending list before normal paragraph
    flushList(`pre-p-${index}`);

    if (trimmed === "") {
      elements.push(<div key={`spacer-${index}`} className="h-1.5" />);
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${index}`} className="my-1 text-gray-700 leading-relaxed">
        <InlineFormatting text={trimmed} />
      </p>
    );
  });

  flushList("end");

  return <div className="space-y-0.5 text-xs text-gray-800">{elements}</div>;
}

/**
 * Formats inline bold (**text**), italics (*text*), and code (`code`)
 */
function InlineFormatting({ text }: { text: string }) {
  // Regex to split by bold (**...**) or code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 font-mono text-[11px] border border-emerald-200/50"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function AdminAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Handle typing to trigger autocomplete when starting with '/'
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSelectCommand = (cmdDef: CommandDefinition) => {
    setInput(`${cmdDef.label} `);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleCopyReport = (msg: Message) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const isCommand = text.startsWith("/");
    const commandMatch = isCommand ? text.match(/^\/([a-zA-Z0-9_-]+)/)?.[1] : undefined;

    const userMsg: Message = {
      id: `admin-usr-${Date.now()}`,
      sender: "user",
      text,
      isCommand,
      command: commandMatch,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowAutocomplete(false);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      const botMsg: Message = {
        id: `admin-bot-${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        isCommand: data.isCommand,
        command: data.command,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unable to reach the assistant service.";
      setMessages((prev) => [
        ...prev,
        {
          id: `admin-err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ **Service Notice:** ${errorMsg}\n\nPlease try again shortly or check your network connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter commands for autocomplete popup
  const searchFilter = input.startsWith("/") ? input.slice(1).toLowerCase() : "";
  const filteredCommands = SUPPORTED_COMMANDS.filter(
    (c) => c.command.includes(searchFilter) || c.label.includes(searchFilter)
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`mb-4 bg-white rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 transition-all ${
            isExpanded
              ? "w-[94vw] sm:w-[680px] h-[720px] max-h-[90vh]"
              : "w-[92vw] sm:w-[460px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#11241f] via-[#16332c] to-[#1d3c34] p-4 text-white flex items-center justify-between shadow-xs select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm truncate text-white">Brightloop Intelligence</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Admin Copilot
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/70 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Prisma Database Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Expand / Minimize Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse modal" : "Expand modal"}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>

              {/* Clear Conversation */}
              {messages.length > 1 && (
                <button
                  onClick={() => setMessages([INITIAL_WELCOME_MESSAGE])}
                  title="Clear conversation"
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              {/* Close Widget */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f8faf9]/70 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === "user";

              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[92%] sm:max-w-[88%] px-4 py-3 rounded-2xl leading-relaxed shadow-xs relative group ${
                      isUser
                        ? "bg-[#1d3c34] text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200/90"
                    }`}
                  >
                    {/* Command Badge Header for Analytical Reports */}
                    {!isUser && m.isCommand && m.command && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span>⚡</span>
                          <span>/{m.command.toUpperCase()} REPORT</span>
                        </span>
                        <button
                          onClick={() => handleCopyReport(m)}
                          className="text-[10px] text-gray-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                          title="Copy markdown report"
                        >
                          {copiedId === m.id ? (
                            <span className="text-emerald-600 font-semibold">✓ Copied</span>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Content Rendering */}
                    {isUser ? (
                      <div className="whitespace-pre-line font-medium">{m.text}</div>
                    ) : (
                      <MarkdownRenderer content={m.text} />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 bg-white border border-gray-200/80 px-4 py-3 rounded-2xl rounded-bl-none w-fit text-gray-500 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-emerald-800 ml-1">
                  Querying database &amp; generating intelligence report...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Command Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {SUPPORTED_COMMANDS.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleSend(`${cmd.label} report`)}
                disabled={loading}
                title={cmd.description}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-gray-100/90 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 text-[11px] font-medium text-gray-700 transition-colors border border-gray-200/70 flex items-center gap-1.5"
              >
                <span>{cmd.icon}</span>
                <span className="font-semibold">{cmd.label}</span>
              </button>
            ))}
          </div>

          {/* Input Footer with Autocomplete Popover */}
          <div className="relative bg-white border-t border-gray-200/80 p-3">
            {/* Slash Command Autocomplete Popover */}
            {showAutocomplete && filteredCommands.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in-50 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Analytical Database Commands
                </div>
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => handleSelectCommand(cmd)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-gray-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{cmd.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-gray-900 group-hover:text-emerald-800">
                          {cmd.label}
                        </div>
                        <div className="text-[11px] text-gray-500">{cmd.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-emerald-700 font-mono">
                      select ↵
                    </span>
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowAutocomplete(false);
                }}
                placeholder="Ask a question or type / for database commands..."
                className="flex-1 bg-gray-100/90 text-gray-900 placeholder:text-gray-400 text-xs px-4 py-2.5 rounded-xl border border-transparent focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#142c26] to-[#1d3c34] hover:from-[#1d3c34] hover:to-[#245849] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Brightloop Intelligence" : "Open Brightloop Admin Intelligence"}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#11241f] via-[#16332c] to-[#1d3c34] hover:from-[#16332c] hover:to-[#245849] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative border border-emerald-500/40"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
}

