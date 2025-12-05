import React from "react";

export default function MessageItem({ msg, currentUser }) {
  const isOwn = msg.sender._id === currentUser._id;
  
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} my-2`}>
      <div 
        className={`max-w-xs md:max-w-lg rounded-2xl px-4 py-3 shadow-sm ${
          isOwn 
            ? "bg-[var(--color-bubble-own)] text-[var(--color-bubble-own-text)] rounded-br-lg" 
            : "bg-[var(--color-bubble-other)] text-[var(--color-bubble-other-text)] border border-[var(--color-bubble-other-border)] rounded-bl-lg"
        }`}
      >
        <span className="block text-sm break-words">{msg.content}</span>
        <span className="block text-xs text-right opacity-70 mt-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}