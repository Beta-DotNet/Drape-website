"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PRODUCTS } from "@/lib/data";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  status: string;
  created_at: string;
  product_id?: number | null;
}

interface ChatThread {
  customerId: string;
  lastMessage: ChatMessage;
  unreadCount: number;
}

const ADMIN_ID = "00000000-0000-0000-0000-000000000000";

function AdminChatContent() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all threads (distinct customer IDs) from the DB
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Group by customer (anyone who is not the ADMIN)
        const grouped: Record<string, ChatMessage[]> = {};
        data.forEach((msg: ChatMessage) => {
          const custId = msg.sender_id === ADMIN_ID ? msg.receiver_id : msg.sender_id;
          if (!grouped[custId]) grouped[custId] = [];
          grouped[custId].push(msg);
        });

        const activeThreads: ChatThread[] = Object.keys(grouped).map((custId) => {
          const list = grouped[custId];
          const lastMsg = list[0]; // ordered descending, so index 0 is newest
          const unreadCount = list.filter(
            (m) => m.sender_id === custId && m.status !== "read"
          ).length;

          return {
            customerId: custId,
            lastMessage: lastMsg,
            unreadCount,
          };
        });

        // Sort threads by newest message
        activeThreads.sort(
          (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        );

        setThreads(activeThreads);
        if (activeThreads.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(activeThreads[0].customerId);
        }
      } catch (err) {
        console.warn("Could not load chat threads from Supabase (offline/unmigrated).", err);
        // Fallback demo threads
        const demoCustomerId = "demo-user-12345";
        setThreads([
          {
            customerId: demoCustomerId,
            lastMessage: {
              id: "mock-1",
              sender_id: demoCustomerId,
              receiver_id: ADMIN_ID,
              content: "Is this shoe true to size? My Nike brand size is 10.",
              status: "unread",
              created_at: new Date().toISOString(),
              product_id: 1, // Jordan Jumpman Knockout
            },
            unreadCount: 1,
          },
        ]);
        setSelectedCustomerId(demoCustomerId);
      }
    };

    fetchThreads();

    // Subscribe to all incoming messages globally to update the threads list in real time
    const channel = supabase
      .channel("admin_inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: { new: ChatMessage }) => {
          const newMsg = payload.new;
          const custId = newMsg.sender_id === ADMIN_ID ? newMsg.receiver_id : newMsg.sender_id;
          
          setThreads((prev) => {
            const existsIdx = prev.findIndex((t) => t.customerId === custId);
            const isUnread = newMsg.sender_id === custId && selectedCustomerId !== custId;
            
            const newThread: ChatThread = {
              customerId: custId,
              lastMessage: newMsg,
              unreadCount: existsIdx > -1 
                ? prev[existsIdx].unreadCount + (isUnread ? 1 : 0) 
                : (isUnread ? 1 : 0),
            };

            const filtered = prev.filter((_, idx) => idx !== existsIdx);
            return [newThread, ...filtered];
          });

          // If current selected customer is sender, push to message list
          if (custId === selectedCustomerId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_id === custId) {
              // Mark as read in DB
              void (supabase as any)
                .from("messages")
                .update({ status: "read" })
                .eq("id", newMsg.id)
                .then(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCustomerId]);

  // Load chat messages when selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;

    const loadMessagesForCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${selectedCustomerId},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${selectedCustomerId})`)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const loadedMessages = (data as ChatMessage[] | null) || [];
        setMessages(loadedMessages);

        // Mark all messages as read
        const unreadIds = loadedMessages
          .filter((m) => m.sender_id === selectedCustomerId && m.status !== "read")
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await (supabase as any)
            .from("messages")
            .update({ status: "read" })
            .in("id", unreadIds);

          setThreads((prev) =>
            prev.map((t) =>
              t.customerId === selectedCustomerId ? { ...t, unreadCount: 0 } : t
            )
          );
        }
      } catch (err) {
        console.warn("Could not load user message log, loading offline sandbox log.", err);
        setMessages([
          {
            id: "mock-1",
            sender_id: selectedCustomerId,
            receiver_id: ADMIN_ID,
            content: "Is this shoe true to size? My Nike brand size is 10.",
            status: "read",
            created_at: new Date(Date.now() - 60000).toISOString(),
            product_id: 1,
          },
        ]);
      }
    };

    loadMessagesForCustomer();

    // Subscribe to customer typing broadcasts
    const typingChannel = supabase
      .channel(`chat:${selectedCustomerId}`)
      .on("broadcast", { event: "typing" }, (payload: { payload: { sender_id: string; isTyping: boolean } }) => {
        if (payload.payload.sender_id === selectedCustomerId) {
          setCustomerTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedCustomerId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, customerTyping]);

  // Handle local typing notification
  const handleInputChange = (val: string) => {
    setInputMessage(val);
    if (!selectedCustomerId) return;

    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`chat:${selectedCustomerId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: ADMIN_ID, isTyping: true },
      });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase.channel(`chat:${selectedCustomerId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: ADMIN_ID, isTyping: false },
      });
    }, 1500);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reply message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !attachment) || !selectedCustomerId) return;

    const messageContent = inputMessage;
    const currentAttachment = attachment;

    setInputMessage("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender_id: ADMIN_ID,
      receiver_id: selectedCustomerId,
      content: messageContent,
      image_url: currentAttachment,
      status: "sent",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const { error } = await (supabase as any)
        .from("messages")
        .insert([
          {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            content: newMsg.content,
            image_url: newMsg.image_url,
            status: "sent",
            product_id: messages[0]?.product_id || null,
          },
        ]);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase reply save skipped (mock sandbox mode).", err);
    }
  };

  // Resolve product information for preview
  const getProductInfo = (prodId?: number | null) => {
    if (!prodId) return null;
    return DEFAULT_PRODUCTS.find((p) => p.id === prodId) || null;
  };

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      height: "calc(100vh - var(--header-h))",
      padding: "20px",
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      gap: "20px",
    }}>
      {/* Thread list sidebar */}
      <div style={{
        background: "var(--white)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-card)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border-mid)", background: "#f8fafc" }}>
          <h2 style={{ fontFamily: "var(--font-h)", fontSize: "1.1rem", fontWeight: 700 }}>Seller Inbox</h2>
          <p style={{ fontSize: "11px", color: "var(--text-soft)", marginTop: "2px" }}>Respond to live size & product inquiries</p>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {threads.length > 0 ? (
            threads.map((t) => {
              const active = t.customerId === selectedCustomerId;
              const prod = getProductInfo(t.lastMessage.product_id);
              return (
                <div
                  key={t.customerId}
                  onClick={() => setSelectedCustomerId(t.customerId)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border-mid)",
                    cursor: "pointer",
                    background: active ? "rgba(30,58,95,0.05)" : "transparent",
                    borderLeft: active ? "4px solid var(--navy)" : "4px solid transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>
                      User: {t.customerId.slice(0, 8)}...
                    </span>
                    {t.unreadCount > 0 && (
                      <span style={{ background: "red", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px" }}>
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  {prod && (
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", marginBottom: "4px" }}>
                      🛍️ Inquiry: {prod.name}
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: "var(--text-soft)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", margin: 0 }}>
                    {t.lastMessage.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-soft)", fontSize: "13px" }}>
              No messages received yet.
            </div>
          )}
        </div>
      </div>

      {/* Selected conversation console */}
      {selectedCustomerId ? (
        <div style={{
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: "12px",
          height: "100%",
        }}>
          {/* Header */}
          <div style={{
            background: "var(--white)",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            padding: "14px 20px",
            boxShadow: "var(--sh-card)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>Active Chat Context</div>
              <div style={{ fontSize: "11px", color: "var(--text-soft)", fontFamily: "monospace" }}>Customer UUID: {selectedCustomerId}</div>
            </div>
            {messages[0]?.product_id && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-mid)" }}>
                <span style={{ fontSize: "12px" }}>🛍️ Product Inquiry</span>
              </div>
            )}
          </div>

          {/* Messages window */}
          <div style={{
            background: "var(--white)",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            boxShadow: "var(--sh-card)",
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === ADMIN_ID;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background: isMe ? "var(--navy)" : "#f1f5f9",
                      color: isMe ? "#fff" : "var(--text)",
                      padding: "10px 14px",
                      borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.image_url && (
                      <img src={msg.image_url} alt="attachment" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "6px", marginBottom: "6px", display: "block" }} />
                    )}
                    {msg.content}
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--text-soft)", marginTop: "4px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}

            {customerTyping && (
              <div style={{ alignSelf: "flex-start", background: "#f1f5f9", padding: "10px 14px", borderRadius: "14px 14px 14px 2px", display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-soft)", fontWeight: 600 }}>Customer is typing</span>
                <span style={{ animation: "pulse 1.2s infinite" }}>.</span>
                <span style={{ animation: "pulse 1.2s infinite 0.2s" }}>.</span>
                <span style={{ animation: "pulse 1.2s infinite 0.4s" }}>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Console input form */}
          <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {attachment && (
              <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "8px", background: "rgba(30,58,95,0.08)", border: "1px solid rgba(30,58,95,0.2)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px" }}>
                <span>Attached image preview</span>
                <button type="button" onClick={removeAttachment} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontWeight: 700 }}>✕</button>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#f1f5f9",
                  border: "1px solid var(--border-mid)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                📷
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentChange}
                accept="image/*"
                style={{ display: "none" }}
              />

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type reply and instructions for sizing mapping…"
                style={{
                  flex: 1,
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-mid)",
                  padding: "0 16px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />

              <button
                type="submit"
                style={{
                  background: "var(--navy)",
                  color: "#fff",
                  padding: "0 24px",
                  height: "48px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Send Reply
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--white)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-card)",
          color: "var(--text-soft)",
          fontSize: "14px",
        }}>
          Select a customer conversation from the list to respond.
        </div>
      )}
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Admin Inbox…</div>}>
      <AdminChatContent />
    </Suspense>
  );
}
