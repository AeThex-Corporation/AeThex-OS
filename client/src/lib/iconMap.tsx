import {
  Award, Star, Trophy, Crown, Shield, Zap, Heart, ThumbsUp,
  Users, UserPlus, UserCheck, UserCog, User,
  MessageSquare, MessageCircle, MessagesSquare, Hash, Send,
  Newspaper, PenSquare, PenTool,
  Code, FolderGit2, ClipboardCheck, Ticket, CheckCircle2, BugOff,
  Rocket, Footprints, Gift, Gem, Diamond, Magnet,
  Calendar, CalendarDays, CalendarHeart,
  Video, Clapperboard, Flame,
  Globe, Network, Brain, ShieldCheck, ShieldEllipsis,
  Swords, LogIn, GraduationCap, Sparkles
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "award": Award,
  "star": Star,
  "star-struck": Sparkles,
  "trophy": Trophy,
  "crown": Crown,
  "shield": Shield,
  "zap": Zap,
  "heart": Heart,
  "thumbs-up": ThumbsUp,
  "users": Users,
  "user-plus": UserPlus,
  "user-check": UserCheck,
  "user-cog": UserCog,
  "user": User,
  "message-square": MessageSquare,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  "message-square-plus": MessageSquare,
  "hash": Hash,
  "send": Send,
  "newspaper": Newspaper,
  "pen-square": PenSquare,
  "pen-tool": PenTool,
  "code": Code,
  "folder-git-2": FolderGit2,
  "clipboard-check": ClipboardCheck,
  "ticket": Ticket,
  "check-circle-2": CheckCircle2,
  "bug-off": BugOff,
  "rocket": Rocket,
  "footprints": Footprints,
  "gift": Gift,
  "gem": Gem,
  "diamond": Diamond,
  "magnet": Magnet,
  "calendar": Calendar,
  "calendar-days": CalendarDays,
  "calendar-heart": CalendarHeart,
  "video": Video,
  "clapperboard": Clapperboard,
  "flame": Flame,
  "globe": Globe,
  "network": Network,
  "brain-circuit": Brain,
  "shield-check": ShieldCheck,
  "shield-ellipsis": ShieldEllipsis,
  "swords": Swords,
  "login": LogIn,
  "logins": LogIn,
  "graduationcap": GraduationCap,
};

export function getIcon(iconName: string | null | undefined): React.ReactNode {
  if (!iconName) return "🏆";
  
  const normalized = iconName.toLowerCase().trim();
  const IconComponent = iconMap[normalized];
  
  if (IconComponent) {
    return <IconComponent className="w-6 h-6 text-primary" />;
  }
  
  if (iconName.length <= 4) {
    return iconName;
  }
  
  return "🏆";
}
