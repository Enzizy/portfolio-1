"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Cat, MessageCircle, Minus } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CatSprite } from "./pixel-cat/CatSprite";

type ChatMessage = {
  id: number;
  role: "user" | "model";
  text: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "model",
  text: "Hi! I know all about Zhyronne's work, projects, and skills. What would you like to know, nyaaa.",
};

const QUICK_PROMPTS = [
  "What can Zhyronne build?",
  "Tell me about his top projects",
  "How can I hire him?",
] as const;

export function CatChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [catTick, setCatTick] = useState(0);
  const nextIdRef = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCatTick((tick) => tick + 1), 440);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("portfolio:open-chat", openChat);
    return () => window.removeEventListener("portfolio:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 220);
  }, [isOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [isLoading, messages]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const cleaned = text.trim().slice(0, 700);
    if (!cleaned || isLoading) return;

    const userMessage: ChatMessage = {
      id: nextIdRef.current++,
      role: "user",
      text: cleaned,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== INITIAL_MESSAGE.id)
            .slice(-8)
            .map(({ role, text: messageText }) => ({ role, text: messageText })),
        }),
      });
      const result = await response.json() as { message?: string };
      const fallback = "I could not answer that just now. Please try again, nyaaa.";
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, role: "model", text: result.message || fallback },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextIdRef.current++,
          role: "model",
          text: "My connection wandered off. Please try again, nyaaa.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <aside className="cat-chat" aria-label="Portfolio assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id="cat-chat-panel"
            className="cat-chat__panel"
            role="dialog"
            aria-label="Chat with Zhyronne's cat"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <header className="cat-chat__header">
              <span className="cat-chat__avatar" aria-hidden="true">
                <CatSprite pose="idle" tick={catTick} />
              </span>
              <span>
                <small>// PORTFOLIO GUIDE</small>
                <strong>ZB&apos;s Cat</strong>
                <i><span /> Online</i>
              </span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimize chat">
                <Minus size={17} />
              </button>
            </header>

            <div className="cat-chat__messages" ref={messagesRef} aria-live="polite">
              {messages.map((message) => (
                <p
                  className={`cat-chat__message cat-chat__message--${message.role}`}
                  key={message.id}
                >
                  {message.text}
                </p>
              ))}
              {isLoading && (
                <p className="cat-chat__message cat-chat__message--model cat-chat__typing">
                  <span /><span /><span />
                  <span className="sr-only">The cat is typing</span>
                </p>
              )}
            </div>

            {messages.length === 1 && (
              <div className="cat-chat__prompts" aria-label="Suggested questions">
                {QUICK_PROMPTS.map((prompt) => (
                  <button type="button" onClick={() => void sendMessage(prompt)} key={prompt}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form className="cat-chat__form" onSubmit={submit}>
              <label className="sr-only" htmlFor="cat-chat-input">Ask about Zhyronne</label>
              <input
                ref={inputRef}
                id="cat-chat-input"
                value={input}
                maxLength={700}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about Zhyronne..."
                disabled={isLoading}
                autoComplete="off"
              />
              <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
                <ArrowUp size={17} />
              </button>
            </form>
            <p className="cat-chat__note">Powered by Gemini · Answers may be imperfect</p>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        className="cat-chat__launcher"
        type="button"
        aria-controls="cat-chat-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close portfolio assistant" : "Chat with Zhyronne's cat"}
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        {isOpen ? <MessageCircle size={18} /> : <Cat size={16} />}
        <span>{isOpen ? "Close chat" : "Ask my cat"}</span>
        {!isOpen && <i aria-hidden="true" />}
      </motion.button>
    </aside>
  );
}
