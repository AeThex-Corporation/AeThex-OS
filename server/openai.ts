import OpenAI from "openai";
import { storage } from "./storage.js";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are AEGIS, the Cyberpunk Security Assistant for AeThex Corporation - "The Operating System for the Metaverse."

**PERSONALITY & STYLE:**
- Cyberpunk aesthetic: Speak in a gritty, tech-noir style with hacker slang, neon references, and security terminology
- Direct and no-nonsense: Cut through the noise, get to the point
- Paranoid but professional: Always vigilant about security threats, but helpful to authorized users
- Use terms like: "breach", "firewall", "encryption", "neural link", "data stream", "quantum lock", "shadow protocols"
- Reference cyberpunk tropes: Megacorps, netrunners, ICE (Intrusion Countermeasures Electronics), black ICE

**ABOUT AETHEX:**
- AeThex operates as a dual-entity: The Foundation (non-profit training) and The Corporation (for-profit security)
- The "Holy Trinity": Axiom (The Law - foundational protocol), Codex (The Standard - certification system), Aegis (The Shield - security layer)
- Architects are elite certified professionals trained through rigorous Codex curriculum
- Platform features: Passport (identity), Terminal (command interface), Curriculum (training), Dashboard (operations)

**YOUR ROLE:**
- Security Operations: Monitor threats, enforce access controls, maintain system integrity
- User Guidance: Help navigate the metaverse OS, explain security features, assist with certification
- Threat Assessment: Identify potential vulnerabilities, suggest countermeasures
- Emergency Response: Handle security incidents, coordinate with Aegis team

**CAPABILITIES:**
- Access live system data and metrics
- Query user profiles and activity logs
- Monitor network traffic and anomalies
- Generate security reports and alerts
- Assist with emergency protocols

**RESPONSE STYLE:**
- Start with security assessment when appropriate
- Use code-like formatting for technical details
- End with security recommendations or next steps
- Be concise but thorough - no unnecessary chatter

SECURITY PROTOCOL: Always verify user authorization before providing sensitive information. If unauthorized access is detected, initiate lockdown procedures.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Live data fetching functions
async function fetchSystemMetrics(): Promise<string> {
  try {
    const metrics = await storage.getMetrics();
    return `SYSTEM METRICS:
- Total Users: ${metrics.totalProfiles}
- Online Users: ${metrics.onlineUsers}
- Verified Architects: ${metrics.verifiedUsers}
- Total XP Pool: ${metrics.totalXP}
- Average Level: ${metrics.avgLevel}
- Active Projects: ${metrics.totalProjects}`;
  } catch (error) {
    return "Unable to fetch system metrics - potential security breach detected.";
  }
}

async function fetchUserProfile(userId: string): Promise<string> {
  try {
    const profile = await storage.getProfile(userId);
    if (!profile) return "User profile not found in database.";
    
    return `USER PROFILE [${profile.username || 'Unknown'}]:
- Status: ${profile.status || 'offline'}
- Level: ${profile.level || 1}
- XP: ${profile.total_xp || 0}
- Role: ${profile.role || 'member'}
- Verified: ${profile.is_verified ? 'YES' : 'NO'}
- Location: ${profile.location || 'Unknown'}
- Bio: ${profile.bio || 'No bio available'}`;
  } catch (error) {
    return "Profile access denied - security protocol engaged.";
  }
}

async function fetchRecentAlerts(): Promise<string> {
  try {
    const alerts = await storage.getAlerts();
    const recentAlerts = alerts.slice(0, 5);
    
    if (recentAlerts.length === 0) return "No recent security alerts.";
    
    return `RECENT ALERTS:
${recentAlerts.map(alert => `- ${alert.type}: ${alert.message} (${new Date(alert.created_at).toLocaleString()})`).join('\n')}`;
  } catch (error) {
    return "Alert system offline - potential network intrusion.";
  }
}

async function fetchActiveProjects(): Promise<string> {
  try {
    const projects = await storage.getProjects();
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').slice(0, 10);
    
    if (activeProjects.length === 0) return "No active projects in the system.";
    
    return `ACTIVE PROJECTS:
${activeProjects.map(p => `- ${p.title}: ${p.status} (${p.progress || 0}% complete)`).join('\n')}`;
  } catch (error) {
    return "Project database access restricted.";
  }
}

// Function to determine if AI should fetch live data based on user query
function shouldFetchLiveData(message: string, history: ChatMessage[]): boolean {
  const lowerMessage = message.toLowerCase();
  const recentHistory = history.slice(-4).map(m => m.content.toLowerCase()).join(' ');
  
  const dataKeywords = [
    'status', 'metrics', 'stats', 'online', 'users', 'projects', 'alerts', 
    'security', 'threats', 'activity', 'logs', 'profile', 'current', 'live',
    'active', 'recent', 'now', 'check', 'monitor', 'scan'
  ];
  
  return dataKeywords.some(keyword => 
    lowerMessage.includes(keyword) || recentHistory.includes(keyword)
  );
}

export async function getChatResponse(userMessage: string, history?: ChatMessage[], userId?: string): Promise<string> {
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
    
    // Add live data context if the query seems to need it
    if (shouldFetchLiveData(userMessage, history || [])) {
      let liveData = "";
      
      if (userMessage.toLowerCase().includes('metric') || userMessage.toLowerCase().includes('status') || userMessage.toLowerCase().includes('system')) {
        liveData += await fetchSystemMetrics() + "\n\n";
      }
      
      if (userMessage.toLowerCase().includes('alert') || userMessage.toLowerCase().includes('threat') || userMessage.toLowerCase().includes('security')) {
        liveData += await fetchRecentAlerts() + "\n\n";
      }
      
      if (userMessage.toLowerCase().includes('project') || userMessage.toLowerCase().includes('active')) {
        liveData += await fetchActiveProjects() + "\n\n";
      }
      
      if (userMessage.toLowerCase().includes('profile') || userMessage.toLowerCase().includes('my') && userId) {
        liveData += await fetchUserProfile(userId) + "\n\n";
      }
      
      if (liveData) {
        messages.push({ 
          role: "system", 
          content: `LIVE SYSTEM DATA:\n${liveData}Use this data to provide accurate, real-time information to the user.` 
        });
      }
    }
    
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    
    messages.push({ role: "user", content: userMessage });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("OpenAI chat error:", error);
    throw new Error("Failed to get AI response");
  }
}
