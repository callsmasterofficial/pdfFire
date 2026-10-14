"use client";

import React from "react";
import { MessageSquare, Bot, User, Bookmark } from "lucide-react";
import { QaAnswerResult } from "@/lib/ai/types";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: QaAnswerResult["citations"];
  confidence?: number;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  onSelectPrompt: (prompt: string) => void;
}

const PRESET_QUESTIONS = [
  "What are the main conclusions or findings?",
  "Are there specific deadlines or dates mentioned?",
  "Summarize key metrics, totals, or financial amounts.",
];

export function ChatMessageList({ messages, onSelectPrompt }: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/10">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <MessageSquare className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Ask questions about this PDF</p>
          <p className="text-[11px] text-muted-foreground">
            Type an inquiry below or pick from these suggested questions:
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelectPrompt(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-border/70 bg-card hover:bg-muted/40 text-foreground/80 hover:text-foreground transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 text-xs leading-relaxed ${
            msg.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {msg.sender === "assistant" && (
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="size-4" />
            </div>
          )}

          <div
            className={`p-3.5 rounded-2xl max-w-[85%] space-y-2 ${
              msg.sender === "user"
                ? "bg-primary text-primary-foreground rounded-br-xs"
                : "bg-muted/40 border border-border/60 text-foreground rounded-bl-xs"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>

            {msg.citations && msg.citations.length > 0 && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Bookmark className="size-3" />
                  Citations ({msg.confidence}% match confidence)
                </span>
                <div className="space-y-1">
                  {msg.citations.map((cite, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-1.5 rounded bg-background/60 border border-border/40 text-[11px] font-mono text-muted-foreground"
                    >
                      <span className="font-bold text-primary mr-1">Page {cite.pageNumber}:</span>
                      <span>&ldquo;{cite.snippet}&rdquo;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {msg.sender === "user" && (
            <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
              <User className="size-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
