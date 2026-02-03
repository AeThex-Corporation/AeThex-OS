import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Search, Loader2 } from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { isEmbedded } from "@/lib/embed-utils";
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
