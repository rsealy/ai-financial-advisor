import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';

const SUGGESTIONS = [
  'How is my financial health overall?',
  'Where can I cut spending this month?',
  'Should I pay off debt or invest?',
  'Create a budget plan for me',
  'How much should I save for an emergency fund?',
  'Analyze my spending patterns',
];

const MODELS = [
  { id: 'gpt-5.2', name: 'GPT-5.2', desc: 'Latest flagship' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', desc: 'Fast & capable' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', desc: 'Lightweight & efficient' },
];

export default function Advisor({ connected, messages, setMessages, selectedModel, setSelectedModel, onReset }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modelPickerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close model picker on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
          model: selectedModel,
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

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Model Picker */}
            <div ref={modelPickerRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModelPicker(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Bot size={14} />
                {currentModel.name}
                <ChevronDown size={14} />
              </button>
              {showModelPicker && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 6, minWidth: 220,
                  boxShadow: 'var(--shadow-lg)', zIndex: 50,
                }}>
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                      style={{
                        display: 'flex', flexDirection: 'column', width: '100%',
                        padding: '10px 12px', background: model.id === selectedModel ? 'var(--accent-light)' : 'transparent',
                        border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (model.id !== selectedModel) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { if (model.id !== selectedModel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: model.id === selectedModel ? 'var(--accent)' : 'var(--text-primary)',
                      }}>
                        {model.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{model.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Reset Chat */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={onReset}
              title="Reset chat"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={14} />
              New Chat
            </button>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Using {currentModel.name} &middot; {currentModel.desc}
            </span>
          </div>
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
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`}>
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
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
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
