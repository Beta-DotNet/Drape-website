"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PRODUCTS, Product } from "@/lib/data";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  status: string;
  created_at: string;
}

const ADMIN_ID = "00000000-0000-0000-0000-000000000000"; // Platform Seller / Admin ID

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("product");
  const orderIdParam = searchParams.get("order");

  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [guestId, setGuestId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("drape_guest_user_id") || "";
    }
    return "";
  });
  const [isTyping, setIsTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize guest user ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("drape_guest_user_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("drape_guest_user_id", id);
        setGuestId(id);
      }
    }
  }, []);

  // Resolve product or order context
  useEffect(() => {
    if (productIdParam) {
      const found = DEFAULT_PRODUCTS.find((p) => p.id === parseInt(productIdParam));
      if (found && product?.id !== found.id) {
        setProduct(found);
      }
    }
  }, [productIdParam, product]);

  // Load message history from Supabase + Fallback to Mock Chat for rich demo
  useEffect(() => {
    if (!guestId) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${guestId},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${guestId})`)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data);
        } else {
          // Initialize mock welcome messages
          const welcome: ChatMessage[] = [
            {
              id: "welcome-1",
              sender_id: ADMIN_ID,
              receiver_id: guestId,
              content: product
                ? `Hi there! I see you are interested in the ${product.name} by ${product.brand}. How can I help you with sizing or styling today?`
                : "Hello! Welcome to drape customer support. Ask us anything about sizing, fit, or order tracking!",
              status: "read",
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
          ];
          setMessages(welcome);
        }
      } catch (err) {
        console.warn("Could not load message history from Supabase (offline/unmigrated).");
        // Fallback mock welcome
        setMessages([
          {
            id: "welcome-1",
            sender_id: ADMIN_ID,
            receiver_id: guestId,
            content: product
              ? `Hi! Interested in the ${product.name}? Ask me anything about its fit or fabric.`
              : "Hi! How can we help you with drape sizing today?",
            status: "read",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };

    loadMessages();

    // Subscribe to messages changes & Broadcast channel for typing
    const messagesChannel = supabase
      .channel(`chat:${guestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${guestId}`,
        },
        (payload: { new: ChatMessage }) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read immediately
          supabase
            .from("messages")
            .update({ status: "read" })
            .eq("id", newMsg.id)
            .then(() => {});
        }
      )
      .on("broadcast", { event: "typing" }, (payload: { payload: { sender_id: string; isTyping: boolean } }) => {
        if (payload.payload.sender_id === ADMIN_ID) {
          setOpponentTyping(payload.payload.isTyping);
        }
      })
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [guestId, product]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, opponentTyping]);

  // Handle typing status broadcast
  const handleInputChange = (val: string) => {
    setInputMessage(val);
    if (!guestId) return;

    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`chat:${guestId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: guestId, isTyping: true },
      });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase.channel(`chat:${guestId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: guestId, isTyping: false },
      });
    }, 1500);
  };

  // Convert uploaded image to Base64
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

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !attachment) return;

    const messageContent = inputMessage;
    const currentAttachment = attachment;

    setInputMessage("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender_id: guestId,
      receiver_id: ADMIN_ID,
      content: messageContent,
      image_url: currentAttachment,
      status: "sent",
      created_at: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, newMsg]);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          receiver_id: newMsg.receiver_id,
          content: newMsg.content,
          image_url: newMsg.image_url,
          order_id: orderIdParam || null,
          product_id: product ? product.id : null,
          status: "sent",
        },
      ]);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase save error, simulating chat reply locally.", err);
    }

    // Trigger mock admin reply to simulate real interaction if offline or no admin responds
    setTimeout(() => {
      setOpponentTyping(true);
      setTimeout(() => {
        setOpponentTyping(false);
        const replyText = getMockAdminReply(messageContent, product);
        const replyMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender_id: ADMIN_ID,
          receiver_id: guestId,
          content: replyText,
          status: "read",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMsg]);

        // Try writing reply to DB so admin inbox can see it
        supabase
          .from("messages")
          .insert([
            {
              id: replyMsg.id,
              sender_id: replyMsg.sender_id,
              receiver_id: replyMsg.receiver_id,
              content: replyMsg.content,
              status: "read",
              product_id: product ? product.id : null,
            },
          ])
          .then(() => {});
      }, 2000);
    }, 1500);
  };

  const getMockAdminReply = (text: string, prod: Product | null): string => {
    const clean = text.toLowerCase();
    if (clean.includes("size") || clean.includes("fit") || clean.includes("recommend")) {
      if (prod) {
        return `For the ${prod.name}, we find it runs true to size. Based on standard fits, we'd recommend your normal sizing, but if you complete the AI scan in your size profile, we can match it down to the exact millimeter!`;
      }
      return "Drape size profile mapping uses your height, weight, and shoulder measurements to match you perfectly across brands. I highly suggest using the 'AI scan' tab on your profile page!";
    }
    if (clean.includes("price") || clean.includes("discount") || clean.includes("cost")) {
      if (prod) {
        return `The ${prod.name} is currently priced at $${prod.price}. We are offering free express delivery inside Harare this week!`;
      }
      return "Our current prices are as displayed. You can check the 'Hot Deals' banner on the home page for active promotions!";
    }
    if (clean.includes("delivery") || clean.includes("track") || clean.includes("shipping")) {
      return "All orders placed are dispatched within 2 hours. Once dispatched, you can track your rider in real time on the tracking page!";
    }
    return "Thanks for your inquiry! Our support agent will check this and get back to you shortly. Let me know if you have any size queries in the meantime!";
  };

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "0 auto",
      height: "calc(100vh - var(--header-h))",
      padding: "20px",
      display: "grid",
      gridTemplateRows: product ? "auto 1fr auto" : "1fr auto",
      gap: "12px",
    }}>
      {/* Product context banner */}
      {product && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "12px 18px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          <img src={product.images[0]} alt={product.name} style={{ width: "40px", height: "46px", objectFit: "cover", borderRadius: "6px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", fontWeight: 700 }}>Inquiring About:</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{product.name}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{product.brand} · ${product.price}</div>
          </div>
          <button 
            onClick={() => {
              const urlParams = new URLSearchParams(searchParams.toString());
              urlParams.delete("product");
              router.replace(`/chat?${urlParams.toString()}`);
              setProduct(null);
            }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages area */}
      <div style={{
        background: "var(--white)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-card)",
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-mid)", paddingBottom: "10px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "#10b981" : "#f59e0b" }}></div>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Drape Fashion Specialist</span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-soft)" }}>⚡ Typically replies in minutes</span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender_id === guestId;
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
                  padding: "12px 16px",
                  borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="attachment"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "180px",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      display: "block",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(msg.image_url!, "_blank")}
                  />
                )}
                {msg.content}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-soft)", marginTop: "4px", display: "flex", gap: "4px", alignItems: "center" }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {isMe && (
                  <span>· {msg.status === "read" ? "Read" : "Sent"}</span>
                )}
              </div>
            </div>
          );
        })}

        {opponentTyping && (
          <div style={{ alignSelf: "flex-start", background: "#f1f5f9", padding: "10px 14px", borderRadius: "14px 14px 14px 2px", display: "flex", gap: "4px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-soft)", fontWeight: 600 }}>Typing</span>
            <span className="dot-typing" style={{ animation: "pulse 1.2s infinite" }}>.</span>
            <span className="dot-typing" style={{ animation: "pulse 1.2s infinite 0.2s" }}>.</span>
            <span className="dot-typing" style={{ animation: "pulse 1.2s infinite 0.4s" }}>.</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {attachment && (
          <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "8px", background: "rgba(30,58,95,0.08)", border: "1px solid rgba(30,58,95,0.2)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--navy)" }}>
            <span style={{ marginRight: "4px" }}>🖼️ Photo attached</span>
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
              flexShrink: 0,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
            title="Attach Photo"
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
            placeholder="Type your message about sizing, styles, or fits…"
            style={{
              flex: 1,
              height: "48px",
              borderRadius: "12px",
              border: "1px solid var(--border-mid)",
              padding: "0 16px",
              fontSize: "14px",
              outline: "none",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
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
              fontSize: "14px",
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#132742"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--navy)"}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Chat…</div>}>
      <ChatContent />
    </Suspense>
  );
}
