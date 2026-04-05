import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const QUICK_PROMPTS = [
  "How do I report a pothole?",
  "How does AI triage work?",
  "What issues can I report?",
  "How to track my report?",
];

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm **CivicBot** 👋\n\nI'm here to help you navigate the Bareilly Civic Reporting Platform. Ask me anything about reporting issues, tracking your submissions, or how our AI triage system works!",
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    setShowQuickPrompts(false);
    setInput('');
    const userMsg = { role: 'user', text: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const history = updatedMessages.map(m => ({ role: m.role === 'bot' ? 'model' : 'user', text: m.text }));
      const res = await axios.post('/api/chat/', {
        message: messageText,
        history: history.slice(0, -1), // exclude the current message, it's sent as 'message'
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I couldn't reach the server. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatText = (text) => {
    // Simple markdown: **bold**, newlines
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="chatbot-wrapper">
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-bubble"
        aria-label="Open CivicBot"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-2xl font-black">close</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl font-black">smart_toy</span>
            <span className="chatbot-pulse"></span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl font-black text-white">smart_toy</span>
              </div>
              <div>
                <p className="font-black text-white text-sm tracking-tight">CivicBot</p>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">AI Civic Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                  </div>
                )}
                <div
                  className={`chatbot-bubble-msg ${msg.role === 'user' ? 'user' : 'bot'}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-msg-row bot">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                </div>
                <div className="chatbot-bubble-msg bot chatbot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            {/* Quick prompts */}
            {showQuickPrompts && messages.length === 1 && (
              <div className="chatbot-quick-prompts">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-3">Quick Questions</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p)}
                      className="chatbot-quick-btn"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask CivicBot anything..."
              className="chatbot-input"
              disabled={isTyping}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="chatbot-send-btn"
            >
              <span className="material-symbols-outlined text-xl font-black">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
