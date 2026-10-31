"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "When is my next renewal?",
  "What is my active plan?",
  "Do I have any overdue invoices?",
  "Explain late fee policies",
];

export function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi there! I'm your Brightloop billing and support assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "I'm having trouble connecting to the support server. Please try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[420px] h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#142c26] to-[#1d3c34] p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm">Brightloop Support</h3>
                <p className="text-[11px] text-emerald-200/70">Subscription &amp; Billing Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: "welcome",
                        sender: "bot",
                        text: "👋 Hi there! I'm your Brightloop billing and support assistant. How can I help you today?",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ])
                  }
                  title="Clear conversation"
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear</span>
                </button>
              )}

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
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#1d3c34] text-white rounded-br-none shadow-xs"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-200/80 shadow-xs"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 px-3.5 py-2.5 rounded-2xl rounded-bl-none w-fit text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (Always Available) */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 text-[11px] font-medium text-gray-600 transition-colors border border-gray-200/60"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your subscription, bills..."
              className="flex-1 bg-gray-100/80 text-gray-900 placeholder:text-gray-400 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[#1d3c34] hover:bg-[#142d26] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#142c26] to-[#1d3c34] hover:from-[#1d3c34] hover:to-[#25594a] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative border border-emerald-500/30"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <span className="text-2xl group-hover:animate-pulse">💬</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
}

