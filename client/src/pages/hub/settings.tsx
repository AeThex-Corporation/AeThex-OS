import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Bell, Lock, Palette, HardDrive, User, Loader2 } from "lucide-react";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { nanoid } from "nanoid";

export default function SettingsWorkspace() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: "dark",
    fontSize: "medium",
    sidebarCollapsed: false,
    notificationsEnabled: true,
    emailNotifications: true,
    soundEnabled: true,
    autoSave: true,
    privacyLevel: "private",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (data) {
        setSettings({
          theme: data.theme || 'dark',
          fontSize: data.font_size === 14 ? 'medium' : 'large',
          sidebarCollapsed: !data.show_sidebar,
          notificationsEnabled: data.notifications_enabled,
          emailNotifications: data.email_notifications,
          soundEnabled: true,
          autoSave: data.auto_save,
          privacyLevel: data.privacy_profile_visible ? 'public' : 'private'
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    if (!user?.id) return;
    try {
      await supabase.from('workspace_settings').upsert({
        id: nanoid(),
        user_id: user.id,
        theme: newSettings.theme,
        font_size: newSettings.fontSize === 'medium' ? 14 : 16,
        show_sidebar: !newSettings.sidebarCollapsed,
        notifications_enabled: newSettings.notificationsEnabled,
        email_notifications: newSettings.emailNotifications,
        auto_save: newSettings.autoSave,
        privacy_profile_visible: newSettings.privacyLevel === 'public'
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleToggle = (key: string) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleChange = (key: string, value: string) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

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
                <Settings className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Settings</h1>
                <p className="text-zinc-500 text-xs">Workspace preferences</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* Settings Sections */}
          {!loading && (
            <div className="space-y-4">
              {/* Appearance */}
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <Palette className={`w-4 h-4 ${theme.iconClass}`} />
                  <h2 className="text-white font-bold text-sm">Appearance</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleChange("theme", e.target.value)}
                      className={`w-full ${theme.inputBg} border border-zinc-700 text-white text-sm rounded-lg px-3 py-2`}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Font Size</label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => handleChange("fontSize", e.target.value)}
                      className={`w-full ${theme.inputBg} border border-zinc-700 text-white text-sm rounded-lg px-3 py-2`}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-400">Collapse Sidebar</span>
                    <button
                      onClick={() => handleToggle("sidebarCollapsed")}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.sidebarCollapsed ? (theme.isFoundation ? 'bg-red-600' : 'bg-blue-600') : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className={`w-4 h-4 ${theme.iconClass}`} />
                  <h2 className="text-white font-bold text-sm">Notifications</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-300">Push Notifications</p>
                      <p className="text-[10px] text-zinc-500">Get alerts for events</p>
                    </div>
                    <button
                      onClick={() => handleToggle("notificationsEnabled")}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.notificationsEnabled ? (theme.isFoundation ? 'bg-red-600' : 'bg-blue-600') : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-300">Email Notifications</p>
                      <p className="text-[10px] text-zinc-500">Receive email digests</p>
                    </div>
                    <button
                      onClick={() => handleToggle("emailNotifications")}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.emailNotifications ? (theme.isFoundation ? 'bg-red-600' : 'bg-blue-600') : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-300">Sound Effects</p>
                      <p className="text-[10px] text-zinc-500">Play notification sounds</p>
                    </div>
                    <button
                      onClick={() => handleToggle("soundEnabled")}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.soundEnabled ? (theme.isFoundation ? 'bg-red-600' : 'bg-blue-600') : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive className={`w-4 h-4 ${theme.iconClass}`} />
                  <h2 className="text-white font-bold text-sm">Editor</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-300">Auto-save</p>
                    <p className="text-[10px] text-zinc-500">Automatically save work</p>
                  </div>
                  <button
                    onClick={() => handleToggle("autoSave")}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      settings.autoSave ? (theme.isFoundation ? 'bg-red-600' : 'bg-blue-600') : 'bg-zinc-700'
                    }`}
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className={`w-4 h-4 ${theme.iconClass}`} />
                  <h2 className="text-white font-bold text-sm">Privacy</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Profile Privacy</label>
                    <select
                      value={settings.privacyLevel}
                      onChange={(e) => handleChange("privacyLevel", e.target.value)}
                      className={`w-full ${theme.inputBg} border border-zinc-700 text-white text-sm rounded-lg px-3 py-2`}
                    >
                      <option value="private">Private (Only you)</option>
                      <option value="friends">Friends Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <User className={`w-4 h-4 ${theme.iconClass}`} />
                  <h2 className="text-white font-bold text-sm">Account</h2>
                </div>
                <div className="space-y-3">
                  <div className={`${theme.inputBg} p-3 rounded-lg`}>
                    <p className="text-[10px] text-zinc-500">Email</p>
                    <p className="text-white text-xs font-medium">user@example.com</p>
                  </div>
                  <Button variant="outline" className={`w-full border-red-600 text-red-400 text-xs`} size="sm">
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header - hidden when embedded in OS iframe */}
      {!embedded && (
        <div className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Link href="/">
            <button className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Settings className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Workspace Settings</h1>
        </div>
      )}

      <div className="p-6 max-w-4xl mx-auto">
        {/* Appearance Settings */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Font Size
              </label>
              <select
                value={settings.fontSize}
                onChange={(e) => handleChange("fontSize", e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-slate-300">Collapse Sidebar</span>
              <button
                onClick={() => handleToggle("sidebarCollapsed")}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.sidebarCollapsed ? "bg-cyan-600" : "bg-slate-600"
                }`}
              />
            </div>
          </div>
        </Card>

        {/* Notifications Settings */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Notifications</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Push Notifications</p>
                <p className="text-xs text-slate-400">Get alerts for important events</p>
              </div>
              <button
                onClick={() => handleToggle("notificationsEnabled")}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.notificationsEnabled ? "bg-cyan-600" : "bg-slate-600"
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Email Notifications</p>
                <p className="text-xs text-slate-400">Receive email digests</p>
              </div>
              <button
                onClick={() => handleToggle("emailNotifications")}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.emailNotifications ? "bg-cyan-600" : "bg-slate-600"
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Sound Effects</p>
                <p className="text-xs text-slate-400">Play notification sounds</p>
              </div>
              <button
                onClick={() => handleToggle("soundEnabled")}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.soundEnabled ? "bg-cyan-600" : "bg-slate-600"
                }`}
              />
            </div>
          </div>
        </Card>

        {/* Editor Settings */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Editor</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Auto-save</p>
                <p className="text-xs text-slate-400">Automatically save your work</p>
              </div>
              <button
                onClick={() => handleToggle("autoSave")}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.autoSave ? "bg-cyan-600" : "bg-slate-600"
                }`}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Profile Privacy
              </label>
              <select
                value={settings.privacyLevel}
                onChange={(e) => handleChange("privacyLevel", e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              >
                <option value="private">Private (Only you can see)</option>
                <option value="friends">Friends Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
              Change Password
            </Button>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Account</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-700 p-4 rounded">
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white font-medium">user@example.com</p>
            </div>

            <div className="bg-slate-700 p-4 rounded">
              <p className="text-sm text-slate-400">Member Since</p>
              <p className="text-white font-medium">December 23, 2025</p>
            </div>

            <Button variant="outline" className="w-full border-red-600 text-red-400 hover:bg-red-600/10 mt-4">
              Log Out
            </Button>

            <Button variant="outline" className="w-full border-red-600 text-red-400 hover:bg-red-600/10">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
