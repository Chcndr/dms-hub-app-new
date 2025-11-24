/**
 * MIO Agent Chat Component
 * 
 * Interfaccia chat per l'orchestratore multi-agente
 * - Chat principale (mode: auto)
 * - Vista 4 agenti (mode: manual)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://orchestratore.mio-hub.me';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  agent: string;
  content: string;
  timestamp: Date;
}

interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: 'mio',
    name: 'MIO',
    icon: '🎯',
    color: 'bg-blue-500',
    description: 'Orchestratore centrale',
  },
  {
    id: 'dev',
    name: 'Dev',
    icon: '💻',
    color: 'bg-green-500',
    description: 'Agente sviluppo',
  },
  {
    id: 'manus_worker',
    name: 'Manus',
    icon: '🔧',
    color: 'bg-orange-500',
    description: 'Worker manuale',
  },
  {
    id: 'gemini_arch',
    name: 'Gemini',
    icon: '🏗️',
    color: 'bg-purple-500',
    description: 'Architetto sistema',
  },
];

export default function MIOAgentChat() {
  const [view, setView] = useState<'single' | 'quad'>('single');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Per vista 4 agenti
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({
    mio: [],
    dev: [],
    manus_worker: [],
    gemini_arch: [],
  });
  const [agentInputs, setAgentInputs] = useState<Record<string, string>>({
    mio: '',
    dev: '',
    manus_worker: '',
    gemini_arch: '',
  });
  const [agentConversations, setAgentConversations] = useState<Record<string, string | null>>({
    mio: null,
    dev: null,
    manus_worker: null,
    gemini_arch: null,
  });
  const [agentLoading, setAgentLoading] = useState<Record<string, boolean>>({
    mio: false,
    dev: false,
    manus_worker: false,
    gemini_arch: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentMessages]);

  /**
   * Invia messaggio in modalità single (auto)
   */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      agent: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mihub/orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'auto',
          conversationId,
          message: input,
          meta: { source: 'dashboard_main' },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Errore sconosciuto');
      }

      // Salva conversationId per messaggi successivi
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: data.agent,
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[MIO Agent] Error:', err);
      setError(err.message || 'Errore di connessione all\'orchestratore');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Invia messaggio a un agente specifico (manual)
   */
  const sendAgentMessage = async (agentId: string) => {
    const message = agentInputs[agentId];
    if (!message.trim() || agentLoading[agentId]) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      agent: 'user',
      content: message,
      timestamp: new Date(),
    };

    setAgentMessages(prev => ({
      ...prev,
      [agentId]: [...prev[agentId], userMessage],
    }));

    setAgentInputs(prev => ({ ...prev, [agentId]: '' }));
    setAgentLoading(prev => ({ ...prev, [agentId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/mihub/orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'manual',
          targetAgent: agentId,
          conversationId: agentConversations[agentId],
          message,
          meta: { source: 'dashboard_quad', agentBox: agentId },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Errore sconosciuto');
      }

      // Salva conversationId per questo agente
      if (data.conversationId) {
        setAgentConversations(prev => ({
          ...prev,
          [agentId]: data.conversationId,
        }));
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: data.agent,
        content: data.message,
        timestamp: new Date(),
      };

      setAgentMessages(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], assistantMessage],
      }));
    } catch (err: any) {
      console.error(`[MIO Agent ${agentId}] Error:`, err);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: agentId,
        content: `❌ Errore: ${err.message}`,
        timestamp: new Date(),
      };

      setAgentMessages(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], errorMessage],
      }));
    } finally {
      setAgentLoading(prev => ({ ...prev, [agentId]: false }));
    }
  };

  /**
   * Render messaggio singolo
   */
  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    const agent = AGENTS.find(a => a.id === msg.agent);

    return (
      <div
        key={msg.id}
        className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-300' : agent?.color || 'bg-gray-500'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className="text-xs text-gray-500 mb-1">
            {isUser ? 'Tu' : agent?.name || msg.agent} • {msg.timestamp.toLocaleTimeString()}
          </div>
          <div className={`inline-block px-4 py-2 rounded-lg ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render vista singola (chat principale)
   */
  const renderSingleView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold">🎯 MIO Agent - Chat Principale</h2>
          <p className="text-sm text-gray-500">Modalità automatica - L'orchestratore sceglie l'agente migliore</p>
        </div>
        <button
          onClick={() => setView('quad')}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Vista 4 Agenti
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Nessun messaggio. Inizia una conversazione con MIO!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Scrivi un messaggio..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? '...' : <><Send size={16} /> Invia</>}
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Render vista 4 agenti
   */
  const renderQuadView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold">🤖 MIO Agent - Vista 4 Agenti</h2>
          <p className="text-sm text-gray-500">Modalità manuale - Scegli tu l'agente con cui parlare</p>
        </div>
        <button
          onClick={() => setView('single')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Chat Principale
        </button>
      </div>

      {/* Grid 4 agenti */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {AGENTS.map(agent => (
          <div key={agent.id} className="flex flex-col border rounded-lg overflow-hidden">
            {/* Agent Header */}
            <div className={`${agent.color} text-white p-3`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{agent.icon}</span>
                <div>
                  <div className="font-bold">{agent.name}</div>
                  <div className="text-xs opacity-90">{agent.description}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {agentMessages[agent.id].length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Nessun messaggio
                </div>
              ) : (
                agentMessages[agent.id].map(msg => (
                  <div
                    key={msg.id}
                    className={`mb-2 p-2 rounded text-sm ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-white'}`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-2 border-t">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={agentInputs[agent.id]}
                  onChange={(e) => setAgentInputs(prev => ({ ...prev, [agent.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && sendAgentMessage(agent.id)}
                  placeholder="Messaggio..."
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={agentLoading[agent.id]}
                />
                <button
                  onClick={() => sendAgentMessage(agent.id)}
                  disabled={agentLoading[agent.id] || !agentInputs[agent.id].trim()}
                  className={`px-3 py-1 ${agent.color} text-white rounded hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {agentLoading[agent.id] ? '...' : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg shadow-lg">
      {view === 'single' ? renderSingleView() : renderQuadView()}
    </div>
  );
}
