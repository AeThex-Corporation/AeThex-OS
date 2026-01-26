import { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  unread?: boolean;
  created_at?: string;
}

export default function MobileMessaging() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    try {
      if (!user) {
        setMessages([
          {
            id: 'demo',
            sender: 'AeThex Team',
            text: 'Sign in to view your messages',
            timestamp: 'now',
            unread: false
          }
        ]);
        setLoading(false);
        return;
      }

      // Query for messages where user is recipient or sender
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map(m => ({
          id: m.id.toString(),
          sender: m.sender_name || 'Unknown',
          text: m.content || '',
          timestamp: formatTime(m.created_at),
          unread: m.recipient_id === user.id && !m.read,
          created_at: m.created_at
        }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const unreadCount = messages.filter(m => m.unread).length;

  const handleSend = () => {
    if (newMessage.trim()) {
      haptics.light();
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="px-4 py-4 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigate('/');
                  haptics.light();
                }}
                className="p-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 transition-colors"
              >
                <X className="w-6 h-6 text-cyan-400" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">
                  MESSAGES
                </h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-cyan-300 font-mono">{unreadCount} unread</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => (
          <button
            key={message.id}
            onClick={() => haptics.light()}
            className={`w-full text-left rounded-lg p-4 border transition-all ${
              message.unread
                ? 'bg-gradient-to-r from-cyan-900/40 to-emerald-900/40 border-cyan-500/40'
                : 'bg-gray-900/40 border-gray-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white">{message.sender}</h3>
                  {message.unread && (
                    <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className={`text-sm truncate ${message.unread ? 'text-gray-200' : 'text-gray-400'}`}>
                  {message.text}
                </p>
                <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-cyan-500/20 px-4 py-3 safe-area-inset-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
