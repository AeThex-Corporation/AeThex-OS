import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Send, Mail, MailOpen, User, Clock, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import gridBg from '@assets/generated_images/dark_subtle_digital_grid_texture.png';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  read: boolean;
  avatar?: string | null;
}

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipient_id, content }: { recipient_id: string; content: string }) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id, content }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setReplyText("");
      setSelectedMessage(null);
    },
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markReadMutation.mutate(message.id);
    }
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    sendMessageMutation.mutate({
      recipient_id: selectedMessage.sender_id,
      content: replyText,
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const unreadCount = messages?.filter((m) => !m.read).length || 0;

  return (
    <div className="min-h-screen bg-black text-foreground font-mono relative p-4 md:p-8">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{ backgroundImage: `url(${gridBg})`, backgroundSize: "cover" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <Link href="/">
          <button className="mb-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Return to Axiom
          </button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-widest uppercase mb-2">
            Messages
          </h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "No unread messages"}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-secondary/30 backdrop-blur-sm border border-border rounded-lg overflow-hidden"
              >
                <div className="p-4 border-b border-border bg-secondary/50">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Inbox
                  </h2>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {messages && messages.length > 0 ? (
                    messages.map((message) => (
                      <motion.button
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors ${
                          selectedMessage?.id === message.id
                            ? "bg-secondary/70"
                            : message.read
                            ? "opacity-70"
                            : "bg-secondary/30"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {message.avatar ? (
                              <img
                                src={message.avatar}
                                alt={message.sender_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`font-semibold text-sm ${!message.read ? "text-white" : "text-gray-400"}`}>
                                {message.sender_name}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${!message.read ? "text-gray-300" : "text-gray-500"}`}>
                              {message.content}
                            </p>
                          </div>

                          {!message.read && (
                            <div className="flex-shrink-0">
                              <MailOpen className="w-4 h-4 text-cyan-400" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-secondary/30 backdrop-blur-sm border border-border rounded-lg overflow-hidden"
                >
                  {/* Message Header */}
                  <div className="p-6 border-b border-border bg-secondary/50">
                    <div className="flex items-start gap-4">
                      {selectedMessage.avatar ? (
                        <img
                          src={selectedMessage.avatar}
                          alt={selectedMessage.sender_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h2 className="font-semibold text-white text-lg">
                          {selectedMessage.sender_name}
                        </h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedMessage.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="p-6 min-h-[300px]">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {/* Reply Section */}
                  <div className="p-6 border-t border-border bg-secondary/50">
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                        className="bg-black/50 border-border resize-none"
                      />

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedMessage(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sendMessageMutation.isPending}
                          className="bg-primary hover:bg-primary/80"
                        >
                          {sendMessageMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Reply
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center bg-secondary/20 border border-border rounded-lg">
                  <div className="text-center text-muted-foreground p-12">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select a message to read</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
