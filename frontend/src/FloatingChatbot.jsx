import React, { useState, useRef } from "react";
import SettingsModal from "./SettingsModal";

const FloatingChatbot = () => {
  const [open, setOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "👋 Hi! I'm your RAG AI assistant. Ask me anything about your uploaded docs." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Send user message to backend and add AI response
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { sender: "user", text: input.trim() }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { sender: "ai", text: data.answer }]);
    } catch {
      setMessages(msgs => [...msgs, { sender: "ai", text: "Sorry, something went wrong." }]);
    }
    setLoading(false);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {open ? (
        <div className="floating bg-white rounded-xl w-80 md:w-96 h-[500px] flex flex-col overflow-hidden border border-gray-200 shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span role="img" aria-label="bot">🤖</span>
              </div>
              <h3 className="font-semibold">RAG AI Assistant</h3>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSettingsOpen(true)} className="text-white hover:text-indigo-200 focus:outline-none" title="Settings">
                <span role="img" aria-label="settings">⚙️</span>
              </button>
              <button onClick={() => setOpen(false)} className="text-white hover:text-indigo-200 focus:outline-none" title="Minimize">
                <span role="img" aria-label="minimize">➖</span>
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start space-x-2 ${msg.sender === "user" ? "justify-end" : ""}`}>
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span role="img" aria-label="bot">🤖</span>
                  </div>
                )}
                <div className={`rounded-lg p-3 max-w-[80%] text-sm ${msg.sender === "ai" ? "bg-white text-gray-800" : "bg-indigo-600 text-white"}`}>
                  {msg.text}
                </div>
                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span role="img" aria-label="user">🧑</span>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span role="img" aria-label="bot">🤖</span>
                </div>
                <div className="bg-white rounded-lg p-3 typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-gray-200 p-3 bg-gray-50 flex space-x-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              autoComplete="off"
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 focus:outline-none"
              disabled={loading}
            >
              <span role="img" aria-label="send">📤</span>
            </button>
          </form>
          {/* Footer */}
          <div className="text-xs text-gray-500 mt-2 flex justify-between px-3 pb-2">
            <span>Powered by RAG + Gemini</span>
          </div>
        </div>
      ) : (
        <button
          className="floating bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-700"
          onClick={() => setOpen(true)}
          aria-label="Open Chat"
        >
          <span role="img" aria-label="chat">💬</span>
        </button>
      )}
    </div>
  );
};

export default FloatingChatbot;