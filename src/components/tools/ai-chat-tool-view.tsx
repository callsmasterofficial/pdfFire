"use client";

import React, { useState, useEffect } from "react";
import { MessageSquareText, Send, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ChatMessageList, ChatMessage } from "./ai/chat-message-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf, ExtractTextResult } from "@/lib/pdf/operations";
import { askDocumentQuestion } from "@/lib/ai";

export function AiChatToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<ExtractTextResult | null>(null);
  const [inputQuestion, setInputQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setExtractedDoc(null);
      setMessages([]);
      return;
    }
    let isCancelled = false;
    extractTextFromPdf(file, file.name)
      .then((res) => {
        if (!isCancelled) setExtractedDoc(res);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Failed to load document");
      });
    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleSend = (textToSend = inputQuestion) => {
    const q = textToSend.trim();
    if (!q || !extractedDoc) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsSearching(true);

    setTimeout(() => {
      const res = askDocumentQuestion(q, extractedDoc.pages);
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: res.answer,
        citations: res.citations,
        confidence: res.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsSearching(false);
    }, 80);
  };

  return (
    <ToolLayout
      title="Ask PDF"
      description="Ask questions about your PDF and receive contextual answers with cited page references locally."
      icon={MessageSquareText}
      category="Edit & Optimize"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {extractedDoc ? `${extractedDoc.totalPages} pages indexed • Ready for questions` : "Indexing document text..."}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <ChatMessageList
              messages={messages}
              onSelectPrompt={(prompt) => handleSend(prompt)}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 pt-2"
            >
              <Input
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask anything about this document..."
                disabled={!extractedDoc || isSearching}
                className="h-10 text-xs bg-muted/20"
              />
              <Button
                type="submit"
                disabled={!extractedDoc || !inputQuestion.trim() || isSearching}
                className="h-10 px-4 text-xs gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="size-3.5" />
                <span>Ask</span>
              </Button>
            </form>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>100% In-Memory Semantic Search: Neither questions nor documents leave your computer.</span>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
