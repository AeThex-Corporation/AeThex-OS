import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  Zap,
  Award,
  Code,
  MessageSquare,
  ShoppingCart,
  Download,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface StatCard {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface ActivityData {
  date: string;
  projects: number;
  messages: number;
  earnings: number;
  achievements: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const { data: analytics } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (analytics) {
        setStats([
          {
            label: "Total Projects",
            value: analytics.projects_completed || 0,
            change: 25,
            icon: <Code className="w-6 h-6" />,
            color: "text-blue-400"
          },
          {
            label: "Active Messages",
            value: analytics.messages_sent || 0,
            change: 12,
            icon: <MessageSquare className="w-6 h-6" />,
            color: "text-purple-400"
          },
          {
            label: "Total XP",
            value: analytics.total_xp || 0,
            change: 34,
            icon: <Zap className="w-6 h-6" />,
            color: "text-yellow-400"
          },
          {
            label: "Achievements",
            value: analytics.achievements_unlocked || 0,
            change: 8,
            icon: <Award className="w-6 h-6" />,
            color: "text-green-400"
          },
          {
            label: "Marketplace Purchases",
            value: analytics.marketplace_purchases || 0,
            change: 18,
            icon: <ShoppingCart className="w-6 h-6" />,
            color: "text-cyan-400"
          },
          {
            label: "Code Snippets",
            value: analytics.code_snippets_shared || 0,
            change: 42,
            icon: <BarChart3 className="w-6 h-6" />,
            color: "text-pink-400"
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock analytics data for charts
  const stats: StatCard[] = [
    {
      label: "Total Projects",
      value: 12,
      change: 25,
      icon: <Code className="w-6 h-6" />,
      color: "text-blue-400"
    },
    {
      label: "Active Messages",
      value: 48,
      change: 12,
      icon: <MessageSquare className="w-6 h-6" />,
      color: "text-purple-400"
    },
    {
      label: "LP Earned",
      value: "2,450",
      change: 34,
      icon: <Zap className="w-6 h-6" />,
      color: "text-yellow-400"
    },
    {
      label: "Achievements",
      value: 23,
      change: 8,
      icon: <Award className="w-6 h-6" />,
      color: "text-green-400"
    },
    {
      label: "Network Connections",
      value: 156,
      change: 18,
      icon: <Users className="w-6 h-6" />,
      color: "text-cyan-400"
    },
    {
      label: "Code Views",
      value: "3.2K",
      change: 42,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-pink-400"
    }
  ];

  const activityData: ActivityData[] = [
    { date: "Mon", projects: 2, messages: 8, earnings: 120, achievements: 1 },
    { date: "Tue", projects: 1, messages: 12, earnings: 180, achievements: 0 },
    { date: "Wed", projects: 3, messages: 15, earnings: 250, achievements: 2 },
    { date: "Thu", projects: 2, messages: 10, earnings: 160, achievements: 1 },
    { date: "Fri", projects: 4, messages: 18, earnings: 320, achievements: 3 },
    { date: "Sat", projects: 1, messages: 6, earnings: 90, achievements: 0 },
    { date: "Sun", projects: 2, messages: 9, earnings: 140, achievements: 1 }
  ];

  const topActivities = [
    { name: "Code Gallery Views", count: 1240, growth: "+24%" },
    { name: "Marketplace Purchases", count: 48, growth: "+12%" },
    { name: "Project Completions", count: 12, growth: "+50%" },
    { name: "Social Connections", count: 156, growth: "+18%" },
    { name: "Achievement Unlocks", count: 23, growth: "+8%" }
  ];

  const maxValue = Math.max(
    ...activityData.map(d => Math.max(d.projects, d.messages, d.earnings / 50, d.achievements))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-slate-400">Track your growth and engagement</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-slate-800/30 border-slate-700/30">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-slate-700/50 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    +{stat.change}%
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="lg:col-span-2 bg-slate-800/30 border-slate-700/30">
            <div className="p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Weekly Activity
              </h3>
              <div className="space-y-6">
                {/* Projects Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-300">Projects Created</span>
                    <span className="text-xs text-slate-500">7 days</span>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {activityData.map((data, idx) => (
                      <div key={idx} className="flex-1">
                        <div
                          className="bg-gradient-to-t from-cyan-500/40 to-cyan-500 rounded-t-lg mx-auto"
                          style={{
                            height: `${(data.projects / maxValue) * 120}px`,
                            width: "100%"
                          }}
                        />
                        <p className="text-xs text-slate-500 text-center mt-2">{data.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-300">Messages Sent</span>
                    <span className="text-xs text-slate-500">7 days</span>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {activityData.map((data, idx) => (
                      <div key={idx} className="flex-1">
                        <div
                          className="bg-gradient-to-t from-purple-500/40 to-purple-500 rounded-t-lg mx-auto"
                          style={{
                            height: `${(data.messages / maxValue) * 120}px`,
                            width: "100%"
                          }}
                        />
                        <p className="text-xs text-slate-500 text-center mt-2">{data.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Activities */}
          <Card className="bg-slate-800/30 border-slate-700/30">
            <div className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Top Activities
              </h3>
              <div className="space-y-3">
                {topActivities.map((activity, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{activity.name}</span>
                      <span className="text-xs text-green-400 font-semibold">{activity.growth}</span>
                    </div>
                    <div className="text-lg font-bold mt-1">{activity.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <Card className="bg-slate-800/30 border-slate-700/30">
          <div className="p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Engagement Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Avg Daily Active Time", value: "4h 32m", change: "+15 min" },
                { label: "Project Engagement", value: "87%", change: "+5%" },
                { label: "Community Contribution", value: "High", change: "Active" },
                { label: "Learning Progress", value: "62%", change: "+8%" }
              ].map((metric, idx) => (
                <div key={idx} className="p-4 bg-slate-700/20 rounded-lg border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-xs text-green-400">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Goal Progress */}
        <Card className="mt-6 bg-slate-800/30 border-slate-700/30">
          <div className="p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Goals & Progress
            </h3>
            <div className="space-y-4">
              {[
                { goal: "Complete 15 Projects", current: 12, target: 15, color: "bg-blue-500" },
                { goal: "Earn 5,000 LP", current: 2450, target: 5000, color: "bg-yellow-500" },
                { goal: "Unlock 30 Achievements", current: 23, target: 30, color: "bg-purple-500" },
                { goal: "Build 500 Network Connections", current: 156, target: 500, color: "bg-cyan-500" }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.goal}</span>
                    <span className="text-xs text-slate-400">
                      {item.current}/{item.target}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.current / item.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
