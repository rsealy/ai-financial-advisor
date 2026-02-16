import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'How is my financial health overall?',
  'Where can I cut spending this month?',
  'Should I pay off debt or invest?',
  'Create a budget plan for me',
  'How much should I save for an emergency fund?',
  'Analyze my spending patterns',
];

export default function Advisor({ connected }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: connected
        ? "Hello! I'm your AI financial advisor. I have access to your connected accounts and transaction history, so I can give you personalized advice. What would you like to know about your finances?"
        : "Hello! I'm your AI financial advisor. Connect your bank accounts using the sidebar to get personalized financial advice based on your real data. In the meantime, I can answer general financial questions!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting to the server. Please try again.',
      }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h2>AI Financial Advisor</h2>
            <p>Personalized advice powered by your financial data</p>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="chat-bubble">
                <FormattedMessage content={msg.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">
                <Bot size={18} />
              </div>
              <div className="chat-bubble">
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className="quick-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="quick-suggestion"
                onClick={() => sendMessage(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about your finances..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like formatter for AI responses
function FormattedMessage({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`}>
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      const text = trimmed.replace(/^[-*]\s|^\d+\.\s/, '');
      listItems.push(formatInline(text));
    } else {
      flushList();
      if (trimmed.startsWith('### ')) {
        elements.push(<h4 key={i} style={{ fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{trimmed.slice(4)}</h4>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={i} style={{ fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{trimmed.slice(3)}</h3>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h3 key={i} style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>{trimmed.slice(2)}</h3>);
      } else if (trimmed === '') {
        // skip empty lines
      } else {
        elements.push(<p key={i}>{formatInline(trimmed)}</p>);
      }
    }
  });
  flushList();

  return <>{elements}</>;
}

function formatInline(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
