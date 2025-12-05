import React, { useEffect, useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { socket } from "../utils/socket";

export default function ChatSidebar({ selectedUser, setSelectedUser }) {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    API.get("/messages/users")
      .then((res) => setUsers(res.data.data))
      .catch((err) => {
        console.error("Failed to load users:", err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const handleUserOnline = (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === data.userId ? { ...u, isOnline: true } : u
        )
      );
    };

    const handleUserOffline = (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === data.userId
            ? { ...u, isOnline: false, lastSeen: data.lastSeen }
            : u
        )
      );
    };

    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, []);

  return (
    <div className="w-80 bg-[var(--color-bg-secondary)] h-full border-r border-[var(--color-border)] flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-xl font-bold text-[var(--color-text)]">Contacts</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
          </div>
        ) : users.length <= 1 ? (
          <div className="p-4 text-[var(--color-text-muted)] text-center">No other users found</div>
        ) : (
          <ul>
            {users.map((u) => {
              if (u._id === user._id) return null;

              const isSelected = selectedUser && selectedUser._id === u._id;
              
              return (
                <li
                  key={u._id}
                  className={`p-4 cursor-pointer flex items-center gap-3 transition duration-150 ${
                    isSelected
                      ? "bg-[var(--color-brand-light)]"
                      : "hover:bg-[var(--color-hover)]"
                  }`}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="relative">
                    <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full" />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-secondary)] ${
                        u.isOnline ? "bg-green-500" : "bg-slate-400"
                      }`}
                    ></span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="font-semibold text-[var(--color-text)] block truncate">{u.username}</span>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {u.isOnline ? "Online" : `Last seen ${new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}