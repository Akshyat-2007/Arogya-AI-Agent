'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatWindowRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const queryMemberId = searchParams.get('member_id');

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      let member = members.find(m => m.id === parseInt(queryMemberId));
      if (!member) {
        member = members[0];
      }
      setSelectedMember(member);
      fetchChatHistory(member.id);
    }
  }, [members, queryMemberId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (memberId) => {
    try {
      const res = await fetch(`/api/members/${memberId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  const switchMember = (id) => {
    router.push(`/chat?member_id=${id}`);
  };

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const msg = inputMessage.trim();
    if (!msg || !selectedMember || sending) return;

    // Optimistically add user message to state
    const temporaryUserMessage = {
      id: Date.now(),
      sender: 'user',
      message: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, temporaryUserMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await fetch(`/api/members/${selectedMember.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });

      if (res.ok) {
        const data = await res.json();
        // Replace user message with the saved one and add agent message
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== temporaryUserMessage.id);
          return [...filtered, data.user_message, data.agent_message];
        });
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
        // Remove optimistic user message on error
        setMessages(prev => prev.filter(m => m.id !== temporaryUserMessage.id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
      setMessages(prev => prev.filter(m => m.id !== temporaryUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const setQuickPrompt = (promptText) => {
    setInputMessage(promptText);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="glass-card-static text-center p-5 my-5">
        <i className="fas fa-comments fa-4x text-grad-primary mb-3"></i>
        <h3 className="fw-bold mb-2">Setup Your Profiles First</h3>
        <p className="text-secondary max-width-500 mx-auto mb-4">
          No family profiles exist yet. Please create a member profile to start chatting with your AI nutrition coach.
        </p>
        <Link href="/profiles" className="btn btn-grad px-4 py-2">
          <i className="fas fa-plus me-2"></i>Create Profile
        </Link>
      </div>
    );
  }

  const activeMember = selectedMember || members[0];

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        {/* Chat Interface Card */}
        <div className="glass-card-static rounded-4 overflow-hidden shadow-lg border border-secondary-subtle">
          {/* Header of Chat */}
          <div className="p-3 bg-secondary-subtle border-bottom border-secondary-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Arogya AI Coach</h5>
                <p className="small text-secondary mb-0">Personalized chat assistant for family health</p>
              </div>
            </div>

            {/* Chat Member Switcher */}
            <div className="d-flex align-items-center gap-2">
              <span className="small text-secondary fw-semibold d-none d-sm-inline">Chatting For:</span>
              <select
                className="form-select form-select-sm border-secondary-subtle"
                value={activeMember.id}
                onChange={e => switchMember(e.target.value)}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Logs Container */}
          <div className="chat-window" id="chatWindow" ref={chatWindowRef} style={{ height: '400px', overflowY: 'auto', padding: '15px' }}>
            {messages.length === 0 ? (
              <div className="text-center py-5 opacity-75 my-auto">
                <i className="fas fa-comment-medical fa-3x text-secondary mb-3"></i>
                <p className="small text-secondary">
                  Hello! I am Arogya AI, your health coach. Start typing to get nutrition advice for {activeMember.name}.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`chat-message ${isUser ? 'user' : 'agent'} mb-3`}>
                    <div className="chat-avatar">
                      {isUser ? activeMember.name[0].toUpperCase() : <i className="fas fa-robot"></i>}
                    </div>
                    <div className="chat-bubble">
                      <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </div>
                      <span className="time-stamp">
                        {msg.timestamp ? (msg.timestamp.includes(' ') ? msg.timestamp.split(' ')[1].substring(0,5) : msg.timestamp) : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="chat-message agent mb-3">
                <div className="chat-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="chat-bubble">
                  <div className="message-content typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar Form */}
          <div className="chat-input-container p-3 border-top border-secondary-subtle">
            <form onSubmit={handleSendMessage} className="d-flex gap-2">
              <input
                type="text"
                className="form-control border-secondary-subtle py-2 px-3"
                id="chatInput"
                autoComplete="off"
                required
                placeholder="Ask about healthy replacements, recipes, calories, macro advice..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-grad px-4 py-2 d-flex align-items-center gap-2" disabled={sending}>
                <span>Send</span><i className="fas fa-paper-plane"></i>
              </button>
            </form>
            <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center justify-content-lg-start small opacity-75">
              <span className="text-secondary fw-semibold">Quick Prompts:</span>
              <button
                type="button"
                className="btn btn-link btn-xs text-secondary p-0 border-0 text-decoration-none me-2 hover-primary"
                onClick={() => setQuickPrompt('What is a healthy South Indian high protein breakfast?')}
              >
                "Healthy South Indian high protein breakfast"
              </button>
              <button
                type="button"
                className="btn btn-link btn-xs text-secondary p-0 border-0 text-decoration-none me-2 hover-primary"
                onClick={() => setQuickPrompt('Give me a high protein vegetarian substitute for chicken.')}
              >
                "Vegetarian substitute for chicken"
              </button>
              <button
                type="button"
                className="btn btn-link btn-xs text-secondary p-0 border-0 text-decoration-none hover-primary"
                onClick={() => setQuickPrompt('Can you suggest a diet plan to manage high blood pressure?')}
              >
                "Diet plan to manage blood pressure"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
