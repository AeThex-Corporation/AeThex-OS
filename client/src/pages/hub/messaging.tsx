import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Search, Loader2, MessageCircle } from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { nanoid } from "nanoid";

interface Chat {
  id: string;
  username: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export default function Messaging() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMessages(data.map(m => ({
          id: m.id,
          sender: m.sender_id === user?.id ? 'You' : m.sender_id,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString(),
          isOwn: m.sender_id === user?.id
        })));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !selectedChatId) return;
    try {
      const { data, error } = await supabase.from('messages').insert({
        id: nanoid(),
        sender_id: user.id,
        recipient_id: selectedChatId,
        content: messageInput,
        read: false
      }).select().single();
      if (!error && data) {
        const newMessage: Message = {
          id: data.id,
          sender: "You",
          content: messageInput,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: true,
        };
        setMessages([...messages, newMessage]);
        setMessageInput("");
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const filteredChats = chats.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const embedded = isEmbedded();
  const { useMobileStyles, theme } = getResponsiveStyles();

  // Mobile-optimized layout when embedded or on mobile device
  if (useMobileStyles) {
    return (
      <div className="min-h-screen" style={{ background: theme.gradientBg }}>
        <div className="p-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderClass} flex items-center justify-center`}>
                <MessageCircle className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Messages</h1>
                <p className="text-zinc-500 text-xs">{chats.length} conversations</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${theme.inputBg} border-zinc-700 text-white pl-10 text-sm`}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* Chat List */}
          {!loading && (
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                  <MessageCircle className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                  <p className="text-zinc-500 text-sm">No conversations yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Start a new conversation</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full text-left ${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 active:scale-[0.98] transition-all ${
                      selectedChatId === chat.id ? `border-2 ${theme.isFoundation ? 'border-red-500' : 'border-blue-500'}` : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${theme.bgAccent} flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{chat.username[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm">{chat.username}</span>
                          <span className="text-xs text-zinc-500">{chat.timestamp}</span>
                        </div>
                        <p className={`text-xs truncate ${chat.unread ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread && (
                        <div className={`w-2 h-2 rounded-full ${theme.isFoundation ? 'bg-red-500' : 'bg-blue-500'}`} />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Chat Messages */}
          {selectedChat && (
            <div className={`mt-4 ${theme.cardBg} border ${theme.borderClass} rounded-xl overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${theme.borderClass} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{selectedChat.username}</span>
                  <span className="text-xs text-green-400">Online</span>
                </div>
                <button onClick={() => setSelectedChatId("")} className="text-zinc-400">✕</button>
              </div>
              <div className="h-48 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                      msg.isOwn 
                        ? `${theme.isFoundation ? 'bg-red-600' : 'bg-blue-600'} text-white`
                        : 'bg-zinc-700 text-zinc-100'
                    }`}>
                      <p>{msg.content}</p>
                      <span className="text-[10px] opacity-70 mt-1 block">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`p-3 border-t ${theme.borderClass} flex gap-2`}>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className={`${theme.inputBg} border-zinc-700 text-white text-sm flex-1`}
                />
                <Button onClick={handleSendMessage} className={`${theme.activeBtn} ${theme.hoverBtn} px-3`} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Headers - hidden when embedded in OS iframe */}
      {!embedded && (
        <>
          {/* Mobile Header */}
          <div className="md:hidden">
            <MobileHeader title="Messages" />
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
            <Link href="/">
              <button className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
          </div>
        </>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="w-80 border-r border-slate-700 flex flex-col bg-slate-800">
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedChatId === chat.id
                    ? "bg-slate-700"
                    : "hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{chat.username}</span>
                  <span className="text-xs text-slate-400">{chat.timestamp}</span>
                </div>
                <p
                  className={`text-sm truncate ${
                    chat.unread
                      ? "text-white font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {chat.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedChat && (
          <div className="flex-1 flex flex-col bg-slate-900">
            {/* Chat Header */}
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedChat.username}</h2>
              <span className="text-xs text-green-400 font-medium">Online</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-sm px-4 py-2 rounded-lg ${
                      msg.isOwn
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 px-6 py-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-cyan-600 hover:bg-cyan-700 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
