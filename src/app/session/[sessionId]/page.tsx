"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import BackButton from "@/components/BackButton";

interface Message {
  id: number;
  session_id: number;
  created_at: string;
  message_type: string;
  content: string;
  error?: string;
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fetchMessagesRef = useRef<(() => Promise<void>) | null>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fetch-messages?session_id=${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
      } else {
        setError(data.error || "Failed to fetch messages.");
      }
    } catch {
      setError("Failed to fetch messages.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Store fetchMessages in ref
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  // Poll for pending service responses
  const pollPending = useCallback(async () => {
    const res = await fetch(
      `/api/pending-service-responses?session_id=${sessionId}`
    );
    const data = await res.json();
    if (data.pending) {
      setPolling(true);
      setTimeout(pollPending, 10000);
    } else {
      setPolling(false);
      await fetchMessagesRef.current?.(); // Use ref to call fetchMessages
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages(); // Initial fetch
    pollPending();

    return () => {
      // Cleanup if needed
    };
  }, [sessionId, fetchMessages, pollPending]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Create temporary message
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID
      session_id: Number(sessionId),
      created_at: new Date().toISOString(),
      message_type: "user",
      content: input.trim(),
    };

    // Add message to local state immediately
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/create-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, content: input.trim() }),
      });

      if (!response.ok) {
        // Update the message with error state instead of removing it
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...msg, error: "Something went wrong" }
              : msg
          )
        );
        throw new Error("Something went wrong");
      }

      // Start polling for the response
      setPolling(true);
      pollPending();
    } catch {
      // Error is already handled by updating the message
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col p-4">
        {/* Back button positioned in top right */}
        <div className="flex justify-end mb-4">
          <BackButton />
        </div>

        {/* Chat container */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-3/4 mx-auto flex flex-col h-[90vh] bg-white border border-brand-primary/10 rounded-xl shadow-sm overflow-hidden">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-brand-background">
              {loading && messages.length === 0 ? (
                <div className="text-center text-brand-primary/70">
                  Loading messages...
                </div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.message_type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col ${
                          msg.message_type === "user"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl text-base max-w-[75%] break-words
                            ${
                              msg.message_type === "user"
                                ? "bg-brand-primary border border-brand-primary rounded-br-md"
                                : "bg-gray-100 text-brand-primary border border-brand-primary/10 rounded-bl-md"
                            }
                          `}
                        >
                          {msg.content}
                        </div>
                        {msg.error && (
                          <span className="text-red-500 text-sm mt-1">
                            {msg.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {polling && (
                    <div className="text-center text-brand-primary/70">
                      Waiting for response...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            {/* Chat input bar */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-brand-primary/10 bg-white px-4 py-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  polling ? "Waiting for response..." : "Type your message..."
                }
                className="flex-1 p-3 border border-brand-primary/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-gray-50 text-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={sending || polling}
                autoFocus
              />
              <button
                type="submit"
                className="border border-brand-primary/10 px-5 py-2 bg-brand-primary rounded-lg font-semibold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                disabled={sending || !input.trim() || polling}
                title={polling ? "Please wait for the current response" : ""}
              >
                Send
                {polling && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Please wait for the current response
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
