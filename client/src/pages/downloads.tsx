import { Download, Monitor, Apple, Code, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

export default function Downloads() {
  const [latestRelease, setLatestRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/AeThex-Corporation/AeThex-OS/releases')
      .then(res => res.json())
      .then(releases => {
        // Find the latest desktop release (tagged with desktop-v*)
        const desktopRelease = releases.find((r: Release) =>
          r.tag_name.startsWith('desktop-v')
        );
        setLatestRelease(desktopRelease || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch releases:', err);
        setLoading(false);
      });
  }, []);

  const getAssetByPlatform = (platform: string) => {
    if (!latestRelease) return null;
    return latestRelease.assets.find(asset =>
      asset.name.toLowerCase().includes(platform.toLowerCase())
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Download AeThex OS
          </h1>
          <p className="text-slate-400 text-lg">
            Get the desktop application for Windows, macOS, or Linux
          </p>
          {latestRelease && (
            <div className="mt-4 text-sm text-slate-500">
              Latest Version: {latestRelease.tag_name.replace('desktop-v', '')} •
              Released {new Date(latestRelease.published_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading releases...</p>
          </div>
        ) : !latestRelease ? (
          <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Desktop Releases Yet</h2>
            <p className="text-slate-400 mb-6">
              Desktop releases are coming soon. In the meantime, you can:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://aethex.app"
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg font-semibold hover:from-cyan-500 hover:to-emerald-500 transition-all"
              >
                Use Web Version
              </a>
              <a
                href="https://github.com/AeThex-Corporation/AeThex-OS"
                className="px-6 py-3 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-all flex items-center gap-2"
              >
                <Code className="w-5 h-5" />
                Build from Source
              </a>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Windows */}
            <DownloadCard
              icon={<Monitor className="w-12 h-12" />}
              platform="Windows"
              description="MSI Installer for Windows 10/11"
              asset={getAssetByPlatform('windows')}
              formatBytes={formatBytes}
              color="from-blue-600 to-blue-400"
            />

            {/* macOS */}
            <DownloadCard
              icon={<Apple className="w-12 h-12" />}
              platform="macOS"
              description="Universal DMG for Intel & Apple Silicon"
              asset={getAssetByPlatform('macos')}
              formatBytes={formatBytes}
              color="from-slate-600 to-slate-400"
            />

            {/* Linux */}
            <DownloadCard
              icon={<Code className="w-12 h-12" />}
              platform="Linux"
              description="AppImage & DEB packages"
              asset={getAssetByPlatform('linux')}
              formatBytes={formatBytes}
              color="from-orange-600 to-orange-400"
            />
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-cyan-400" />
              Installation Instructions
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <div>
                <strong className="text-white">Windows:</strong> Run the MSI installer and follow the prompts
              </div>
              <div>
                <strong className="text-white">macOS:</strong> Open the DMG file and drag AeThex OS to Applications
              </div>
              <div>
                <strong className="text-white">Linux (AppImage):</strong> Make executable with <code className="bg-slate-900 px-2 py-1 rounded">chmod +x</code> and run
              </div>
              <div>
                <strong className="text-white">Linux (DEB):</strong> Install with <code className="bg-slate-900 px-2 py-1 rounded">sudo dpkg -i filename.deb</code>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download className="w-6 h-6 text-emerald-400" />
              Other Options
            </h3>
            <div className="space-y-3">
              <a
                href="https://aethex.app"
                className="block p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition-all"
              >
                <div className="font-semibold text-cyan-400">Web Application</div>
                <div className="text-sm text-slate-400">Use AeThex OS directly in your browser</div>
              </a>
              <a
                href="https://github.com/AeThex-Corporation/AeThex-OS/releases"
                className="block p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition-all"
              >
                <div className="font-semibold text-emerald-400">All Releases</div>
                <div className="text-sm text-slate-400">View all versions and changelogs</div>
              </a>
              <a
                href="https://github.com/AeThex-Corporation/AeThex-OS"
                className="block p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition-all"
              >
                <div className="font-semibold text-orange-400">Build from Source</div>
                <div className="text-sm text-slate-400">Clone the repository and build locally</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadCard({
  icon,
  platform,
  description,
  asset,
  formatBytes,
  color
}: {
  icon: React.ReactNode;
  platform: string;
  description: string;
  asset: any;
  formatBytes: (bytes: number) => string;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-all">
      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-2">{platform}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>

      {asset ? (
        <>
          <div className="text-xs text-slate-500 mb-3">
            {formatBytes(asset.size)}
          </div>
          <a
            href={asset.browser_download_url}
            className="block w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg font-semibold text-center hover:from-cyan-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </a>
        </>
      ) : (
        <div className="text-sm text-slate-500 text-center py-3">
          Not available yet
        </div>
      )}
    </div>
  );
}
