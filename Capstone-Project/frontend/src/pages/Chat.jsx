import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatSidebar from "../components/ChatSidebar";
import MessageItem from "../components/MessageItem";
import { socket } from "../utils/socket";
import API from "../utils/api";
import { useTheme } from "../context/ThemeProvider";

export default function Chat() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    socket.auth = { token: user.token };
    socket.connect();
    const handleConnect = () => console.log("✅ Socket connected");
    const handleDisconnect = () => console.log("❌ Socket disconnected");
    const handleConnectError = (err) => console.error("Socket error:", err);

    const handleReceiveMessage = (newMessage) => {
      if (selectedUser && newMessage.sender._id === selectedUser._id) {
        setMessages((msgs) => [...msgs, newMessage]);
      }
    };

    const handleMessageSent = (sentMessage) => {
      setMessages((msgs) => [...msgs, sentMessage]);
    };

    const handleUserTyping = (fromUserId) => {
      if (selectedUser && fromUserId === selectedUser._id) setTyping(true);
    };
    const handleUserStopTyping = (fromUserId) => {
      if (selectedUser && fromUserId === selectedUser._id) setTyping(false);
    };

    const updateUserStatus = (data, isOnline) => {
      setSelectedUser(prev => {
        if (prev && prev._id === data.userId) {
          return { ...prev, isOnline, lastSeen: data.lastSeen };
        }
        return prev;
      });
    };
    const handleUserOnline = (data) => updateUserStatus(data, true);
    const handleUserOffline = (data) => updateUserStatus(data, false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      console.log("🧼 Cleaning up socket listeners and disconnecting...");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.disconnect();
    };
  }, [user]); 
  useEffect(() => {
    if (!selectedUser) {
        setMessages([]); 
        return;
    }
    setLoading(true);
    setTyping(false);

    API.get(`/messages/user/${selectedUser._id}`)
      .then((res) => {
        setMessages(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setMessages([]); 
      })
      .finally(() => {
        setLoading(false); 
      });
  }, [selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser || sending) return;

    setSending(true);
    socket.emit("sendMessage", {
      receiverId: selectedUser._id,
      content: content.trim(),
    });
    setContent("");
    setSending(false); 
  };

  useEffect(() => {
    if (!content || !selectedUser) return;

    socket.emit("typing", { to: selectedUser._id });

    const timerId = setTimeout(() => {
      socket.emit("stop-typing", { to: selectedUser._id });
    }, 1000);

    return () => clearTimeout(timerId);
  }, [content, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      <ChatSidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex gap-3 items-center min-w-0">
            {selectedUser ? (
              <>
                <img src={selectedUser.avatar} className="w-10 h-10 rounded-full flex-shrink-0" alt="" />
                <div className="overflow-hidden"> 
                  <span className="font-bold text-[var(--color-text)] block truncate">{selectedUser.username}</span>
                  <span className={`block text-xs ${selectedUser.isOnline ? "text-green-600" : "text-[var(--color-text-muted)]"} truncate`}>
                    {selectedUser.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-[var(--color-text-muted)]">Select a user to start chatting</span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="bg-[var(--color-bg-secondary)] p-2 rounded-full text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand)]"></div>
            </div>
          ) : selectedUser ? (
            <>
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => <MessageItem key={msg._id} msg={msg} currentUser={user} />)
              )}
              {typing && <div className="text-[var(--color-text-muted)] italic text-sm">Typing...</div>}
              <div ref={messagesEndRef}></div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-text-muted)] text-lg">
              Select a user to start chatting
            </div>
          )}
        </div>

        {selectedUser && (
          <form onSubmit={sendMessage} className="flex gap-3 p-4 border-t border-[var(--color-border)] bg-[var(--color-card)]">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 border border-[var(--color-input-border)] bg-[var(--color-input)] text-[var(--color-text)] rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              placeholder="Type your message..."
              disabled={sending}
              autoFocus 
            />
            <button
              className={`px-6 py-3 rounded-full font-semibold transition ${
                sending || !content.trim()
                  ? "bg-slate-400 text-slate-100 cursor-not-allowed" 
                  : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white"
              }`}
              type="submit"
              disabled={sending || !content.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}