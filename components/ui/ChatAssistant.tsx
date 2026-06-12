"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { message } from "antd";
import {
  CloseOutlined,
  SendOutlined,
  DeleteOutlined
} from "@ant-design/icons";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface AIConfig {
  isChatEnabled: boolean;
  aiModel: string;
  temperature: number;
  welcomeMessage: string;
  systemPrompt: string;
}

export function ChatAssistant() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { addToCart, clearCart, openCartModal } = useCart();
  
  // Active chat state: "system" | "restaurant" | null
  const [activeChat, setActiveChat] = useState<"system" | "restaurant" | null>(null);

  // System Chat States
  const [historySystem, setHistorySystem] = useState<ChatMessage[]>([]);
  const [querySystem, setQuerySystem] = useState("");
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
  
  // Restaurant Chat States
  const [historyRestaurant, setHistoryRestaurant] = useState<ChatMessage[]>([]);
  const [queryRestaurant, setQueryRestaurant] = useState("");
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [sessionIdRestaurant, setSessionIdRestaurant] = useState<string>("");

  // AI Configuration States
  const [aiConfigSystem, setAiConfigSystem] = useState<AIConfig>({
    isChatEnabled: true,
    aiModel: "gemini-2.5-flash",
    temperature: 0.4,
    welcomeMessage: "Trợ lý ảo hỗ trợ tìm hiểu về nền tảng SaaS quản lý nhà hàng XFoodi. Hãy hỏi tôi về các gói dịch vụ, giá thành hoặc cách đăng ký ngay!",
    systemPrompt: ""
  });

  const [aiConfigRestaurant, setAiConfigRestaurant] = useState<AIConfig>({
    isChatEnabled: true,
    aiModel: "gemini-2.5-flash",
    temperature: 0.2,
    welcomeMessage: "Chào mừng bạn đến với nhà hàng! Tôi có thể tư vấn món ăn ngon, cách đặt bàn hay kết nối trực tiếp đến nhân viên phục vụ giúp bạn.",
    systemPrompt: ""
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch AI Configuration for System Chat on mount
  useEffect(() => {
    fetch("/api/ai/config?restaurantId=system")
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setAiConfigSystem(res.data);
        }
      })
      .catch(err => console.error("[ChatAssistant] Fetch system config error:", err));
  }, []);

  // 2. Fetch AI Configuration for Restaurant Chat when tenant changes
  useEffect(() => {
    if (tenant?.id && tenant.id !== "demo") {
      fetch(`/api/ai/config?restaurantId=${tenant.id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setAiConfigRestaurant(res.data);
          }
        })
        .catch(err => console.error("[ChatAssistant] Fetch restaurant config error:", err));
    }
  }, [tenant?.id]);

  // 3. Initialize Restaurant session ID and load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && tenant?.id) {
      let savedSessionId = localStorage.getItem(`xfoodi-chat-session-${tenant.id}`);
      if (!savedSessionId) {
        savedSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(`xfoodi-chat-session-${tenant.id}`, savedSessionId);
      }
      setSessionIdRestaurant(savedSessionId);

      const savedHistory = localStorage.getItem(`xfoodi-chat-history-restaurant-${tenant.id}-${savedSessionId}`);
      if (savedHistory) {
        try {
          setHistoryRestaurant(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse saved restaurant chat history", e);
        }
      } else {
        setHistoryRestaurant([]);
      }
    }
  }, [tenant?.id]);

  // 4. Load System history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("xfoodi-chat-history-system");
      if (savedHistory) {
        try {
          setHistorySystem(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse saved system chat history", e);
        }
      }
    }
  }, []);

  // 5. Save System history to localStorage
  useEffect(() => {
    if (historySystem.length > 0) {
      localStorage.setItem("xfoodi-chat-history-system", JSON.stringify(historySystem));
    }
  }, [historySystem]);

  // 6. Save Restaurant history to localStorage
  useEffect(() => {
    if (tenant?.id && sessionIdRestaurant && historyRestaurant.length > 0) {
      localStorage.setItem(
        `xfoodi-chat-history-restaurant-${tenant.id}-${sessionIdRestaurant}`,
        JSON.stringify(historyRestaurant)
      );
    }
  }, [historyRestaurant, tenant?.id, sessionIdRestaurant]);

  // 7. Inject welcome messages if histories are empty
  useEffect(() => {
    if (aiConfigSystem?.welcomeMessage) {
      setHistorySystem(prev => {
        if (prev.length === 0) {
          return [{ role: "model", content: aiConfigSystem.welcomeMessage }];
        }
        return prev;
      });
    }
  }, [aiConfigSystem]);

  useEffect(() => {
    if (aiConfigRestaurant?.welcomeMessage && tenant?.id) {
      setHistoryRestaurant(prev => {
        if (prev.length === 0) {
          return [{ role: "model", content: aiConfigRestaurant.welcomeMessage }];
        }
        return prev;
      });
    }
  }, [aiConfigRestaurant, tenant?.id]);

  // Auto-scroll to bottom of chat window
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [historySystem, historyRestaurant, activeChat, isLoadingSystem, isLoadingRestaurant]);

  const handleClearHistory = (type: "system" | "restaurant") => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện này?")) {
      if (type === "system") {
        setHistorySystem(aiConfigSystem.welcomeMessage ? [{ role: "model", content: aiConfigSystem.welcomeMessage }] : []);
        localStorage.removeItem("xfoodi-chat-history-system");
      } else {
        setHistoryRestaurant(aiConfigRestaurant.welcomeMessage ? [{ role: "model", content: aiConfigRestaurant.welcomeMessage }] : []);
        if (tenant?.id && sessionIdRestaurant) {
          localStorage.removeItem(`xfoodi-chat-history-restaurant-${tenant.id}-${sessionIdRestaurant}`);
        }
      }
      message.success("Đã xóa lịch sử trò chuyện!");
    }
  };

  const executeA2UIActions = (text: string) => {
    const actionRegex = /\[ACTION:\s*([A-Z_]+)(?:\s+({.*?}))?\s*\]/g;
    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      const actionName = match[1];
      const actionArgsStr = match[2];
      console.log(`[A2UI Action] Detected: ${actionName} with args: ${actionArgsStr}`);

      try {
        const args = actionArgsStr ? JSON.parse(actionArgsStr) : {};

        if (actionName === "ADD_TO_CART") {
          if (args.id && args.name && args.price) {
            addToCart({
              id: args.id,
              name: args.name,
              price: String(args.price),
              quantity: Number(args.quantity || 1),
              category: "food",
              categoryId: args.categoryId || "dish"
            });
          } else {
            console.warn("ADD_TO_CART missing arguments:", args);
          }
        } else if (actionName === "CLEAR_CART") {
          clearCart();
          message.info("🧹 Đã làm trống giỏ hàng!");
        } else if (actionName === "OPEN_CART") {
          openCartModal();
          message.info("🛒 Đã mở giỏ hàng!");
        } else if (actionName === "CALL_WAITER") {
          handleSuggestionClick("restaurant", "CALL_WAITER");
        }
      } catch (e) {
        console.error("Failed to parse or execute action args:", e, actionArgsStr);
      }
    }
  };

  const handleSend = async (chatType: "system" | "restaurant", textToSend?: string) => {
    const isSystem = chatType === "system";
    const query = isSystem ? querySystem : queryRestaurant;
    const activeText = (textToSend || query).trim();
    if (!activeText) return;

    if (!textToSend) {
      if (isSystem) setQuerySystem("");
      else setQueryRestaurant("");
    }

    const history = isSystem ? historySystem : historyRestaurant;
    const updatedHistory: ChatMessage[] = [...history, { role: "user", content: activeText }];
    
    if (isSystem) {
      setHistorySystem(updatedHistory);
      setIsLoadingSystem(true);
    } else {
      setHistoryRestaurant(updatedHistory);
      setIsLoadingRestaurant(true);
    }

    try {
      const response = await fetch(isSystem ? "/api/ai/chat/system" : "/api/ai/chat/restaurant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({
          restaurantId: isSystem ? undefined : tenant?.id,
          query: activeText,
          history: updatedHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          userPreferences: !isSystem && user?.fullName ? `Khách hàng: ${user.fullName}` : undefined,
          sessionId: !isSystem ? (sessionIdRestaurant || undefined) : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Mạng lỗi hoặc máy chủ không phản hồi.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Không thể khởi tạo Stream Reader.");
      }

      const decoder = new TextDecoder();
      let botResponse = "";
      
      if (isSystem) {
        setHistorySystem(prev => [...prev, { role: "model", content: "" }]);
      } else {
        setHistoryRestaurant(prev => [...prev, { role: "model", content: "" }]);
      }

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith("data: ")) continue;
          const jsonStr = cleanLine.substring(6).trim();

          if (jsonStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              botResponse = `Lỗi hệ thống: ${parsed.error}`;
              break;
            }
            if (parsed.text) {
              botResponse += parsed.text;
              
              if (isSystem) {
                setHistorySystem(prev => {
                  const newHist = [...prev];
                  if (newHist.length > 0) {
                    newHist[newHist.length - 1] = {
                      role: "model",
                      content: botResponse
                    };
                  }
                  return newHist;
                });
              } else {
                setHistoryRestaurant(prev => {
                  const newHist = [...prev];
                  if (newHist.length > 0) {
                    newHist[newHist.length - 1] = {
                      role: "model",
                      content: botResponse
                    };
                  }
                  return newHist;
                });
              }
            }
          } catch (err) {
            console.warn("Parse stream chunk error:", err);
          }
        }
      }

      if (!isSystem && botResponse.includes("[ACTION:")) {
        executeA2UIActions(botResponse);
      }

    } catch (err: any) {
      console.error("[Chat API Error]", err);
      if (isSystem) {
        setHistorySystem(prev => {
          const newHist = [...prev];
          if (newHist.length > 0 && newHist[newHist.length - 1].content === "") newHist.pop();
          return [
            ...newHist,
            { role: "model", content: "Xin lỗi, hệ thống đang bận hoặc có lỗi kết nối mạng xảy ra. Vui lòng thử lại." }
          ];
        });
      } else {
        setHistoryRestaurant(prev => {
          const newHist = [...prev];
          if (newHist.length > 0 && newHist[newHist.length - 1].content === "") newHist.pop();
          return [
            ...newHist,
            { role: "model", content: "Xin lỗi, hệ thống đang bận hoặc có lỗi kết nối mạng xảy ra. Vui lòng thử lại." }
          ];
        });
      }
    } finally {
      if (isSystem) setIsLoadingSystem(false);
      else setIsLoadingRestaurant(false);
    }
  };

  const handleSuggestionClick = async (type: "system" | "restaurant", suggestion: string) => {
    if (suggestion === "CALL_WAITER") {
      const userMsg = "Gọi nhân viên phục vụ 🔔";
      const botResponse = "Dạ vâng, tôi đã chuyển yêu cầu của bạn đến nhân viên trực bàn rồi ạ. Nhân viên sẽ tới bàn hỗ trợ bạn ngay lập tức! Bạn có cần tôi tư vấn gì thêm trong thực đơn không?";
      
      setHistoryRestaurant(prev => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "model", content: botResponse }
      ]);
      message.success("🔔 Đã gửi yêu cầu gọi nhân viên phục vụ tới bàn của bạn!");
      return;
    }

    if (suggestion === "MENU") {
      handleSend("restaurant", "Cho tôi xem thực đơn của nhà hàng");
    } else if (suggestion === "BOOKING") {
      handleSend("restaurant", "Tôi muốn hướng dẫn cách đặt bàn");
    } else if (suggestion === "PLATFORM_INFO") {
      handleSend("system", "Giới thiệu cho tôi các tính năng của XFoodi");
    } else if (suggestion === "PRICING") {
      handleSend("system", "Các gói dịch vụ của XFoodi bao nhiêu tiền?");
    }
  };

  const renderMessageContent = (text: string) => {
    if (!text) return "";
    const cleanText = text.replace(/\[ACTION:\s*[A-Z_]+(?:\s+{.*?})?\s*\]/g, "").trim();
    if (!cleanText) return "";
    
    let html = cleanText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-5 my-1 font-sans">$1</ul>');
    html = html.replace(/\n/g, "<br/>");

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Determine visibility states based on user and tenant configurations
  const showSystemBtn = aiConfigSystem.isChatEnabled !== false;
  const showRestaurantChat = !!user && !!tenant?.id && tenant.id !== "demo";
  const showRestaurantBtn = showRestaurantChat && aiConfigRestaurant.isChatEnabled !== false;

  if (!showSystemBtn && !showRestaurantBtn) {
    return null; // Both chats are disabled or user context doesn't permit
  }

  // Positioning of Restaurant Button shifts if System Button is disabled
  const restaurantBtnRightClass = showSystemBtn ? "right-[88px]" : "right-6";

  const currentOpenChat = activeChat;
  const currentHistory = currentOpenChat === "system" ? historySystem : historyRestaurant;
  const currentLoading = currentOpenChat === "system" ? isLoadingSystem : isLoadingRestaurant;
  const currentQuery = currentOpenChat === "system" ? querySystem : queryRestaurant;
  const currentSetQuery = currentOpenChat === "system" ? setQuerySystem : setQueryRestaurant;
  const currentConfig = currentOpenChat === "system" ? aiConfigSystem : aiConfigRestaurant;

  return (
    <>
      {/* Floating Toggle Buttons */}
      {showSystemBtn && (
        <button
          onClick={() => setActiveChat(activeChat === "system" ? null : "system")}
          className="fixed bottom-6 right-6 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 group focus:outline-none border border-[var(--border)]"
          aria-label="Toggle System Chat Assistant"
          style={{
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)"
          }}
        >
          {activeChat === "system" ? (
            <CloseOutlined className="text-xl text-[var(--text)] transition-transform duration-300" />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full p-0.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-25 animate-ping group-hover:animate-none -z-10"></span>
              <img
                src="/images/logo/xfoodi-logo.png"
                alt="System Support"
                className="w-12 h-12 rounded-full object-cover bg-white"
              />
            </div>
          )}
        </button>
      )}

      {showRestaurantBtn && (
        <button
          onClick={() => setActiveChat(activeChat === "restaurant" ? null : "restaurant")}
          className={`fixed bottom-6 ${restaurantBtnRightClass} w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 group focus:outline-none border border-[var(--border)]`}
          aria-label="Toggle Restaurant Chat Assistant"
          style={{
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)"
          }}
        >
          {activeChat === "restaurant" ? (
            <CloseOutlined className="text-xl text-[var(--text)] transition-transform duration-300" />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full p-0.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-25 animate-ping group-hover:animate-none -z-10"></span>
              <img
                src={tenant?.logoUrl || "/images/restaurant/default-restaurant.png"}
                alt="Restaurant Support"
                className="w-12 h-12 rounded-full object-cover bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png";
                }}
              />
            </div>
          )}
        </button>
      )}

      {/* Floating Chat Box Window */}
      {currentOpenChat && (
        <div
          className="fixed bottom-24 right-6 w-[360px] md:w-[400px] h-[550px] rounded-2xl flex flex-col shadow-2xl z-50 border border-[var(--border)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 duration-300"
          style={{
            background: "color-mix(in srgb, var(--card) 95%, transparent)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)"
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between"
            style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)" }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src={currentOpenChat === "system" ? "/images/logo/xfoodi-logo.png" : (tenant?.logoUrl || "/images/restaurant/default-restaurant.png")}
                alt="Chat Logo"
                className="w-8 h-8 rounded-full object-cover border border-[var(--border)] bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png";
                }}
              />
              <div>
                <h3 className="font-bold text-sm text-[var(--text)] m-0 leading-tight">
                  {currentOpenChat === "system" 
                    ? "XFoodi AI Support" 
                    : (tenant?.name ? `${tenant.name} AI Assistant` : "Restaurant AI Assistant")}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Trực tuyến</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentHistory.length > 1 && (
                <button
                  onClick={() => handleClearHistory(currentOpenChat)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-red-500 transition-colors focus:outline-none"
                  title="Xóa lịch sử trò chuyện"
                >
                  <DeleteOutlined className="text-sm" />
                </button>
              )}
              <button
                onClick={() => setActiveChat(null)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
              >
                <CloseOutlined className="text-sm" />
              </button>
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <img
                    src={currentOpenChat === "system" ? "/images/logo/xfoodi-logo.png" : (tenant?.logoUrl || "/images/restaurant/default-restaurant.png")}
                    alt="AI Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[var(--border)] bg-white flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png";
                    }}
                  />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-tr-none shadow-sm"
                      : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-tl-none shadow-sm"
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {currentLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <img
                  src={currentOpenChat === "system" ? "/images/logo/xfoodi-logo.png" : (tenant?.logoUrl || "/images/restaurant/default-restaurant.png")}
                  alt="AI Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[var(--border)] bg-white flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png";
                  }}
                />
                <div className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center space-x-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-[var(--border)] bg-black/5 dark:bg-white/5">
            {currentOpenChat === "restaurant" ? (
              <>
                <button
                  onClick={() => handleSuggestionClick("restaurant", "CALL_WAITER")}
                  className="px-2.5 py-1 text-xs bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white text-[var(--primary)] border border-[var(--primary)] rounded-full transition-all focus:outline-none"
                >
                  Gọi phục vụ 🔔
                </button>
                <button
                  onClick={() => handleSuggestionClick("restaurant", "MENU")}
                  className="px-2.5 py-1 text-xs bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border border-[var(--border)] rounded-full transition-all focus:outline-none"
                >
                  Xem thực đơn 📜
                </button>
                <button
                  onClick={() => handleSuggestionClick("restaurant", "BOOKING")}
                  className="px-2.5 py-1 text-xs bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border border-[var(--border)] rounded-full transition-all focus:outline-none"
                >
                  Đặt bàn ăn 📅
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSuggestionClick("system", "PLATFORM_INFO")}
                  className="px-2.5 py-1 text-xs bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white text-[var(--primary)] border border-[var(--primary)] rounded-full transition-all focus:outline-none"
                >
                  Tính năng 💡
                </button>
                <button
                  onClick={() => handleSuggestionClick("system", "PRICING")}
                  className="px-2.5 py-1 text-xs bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border border-[var(--border)] rounded-full transition-all focus:outline-none"
                >
                  Gói dịch vụ 🏷️
                </button>
              </>
            )}
          </div>

          {/* Input Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(currentOpenChat);
            }}
            className="p-3 border-t border-[var(--border)] flex gap-2 items-center"
            style={{ background: "color-mix(in srgb, var(--card) 95%, transparent)" }}
          >
            <input
              type="text"
              value={currentQuery}
              onChange={(e) => currentSetQuery(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={currentLoading}
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
            />
            <button
              type="submit"
              disabled={currentLoading || !currentQuery.trim()}
              className="w-9 h-9 rounded-xl bg-[var(--primary)] disabled:bg-gray-400 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
              <SendOutlined className="text-base" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;
