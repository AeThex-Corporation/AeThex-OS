import { useEffect, useRef, useState } from "react";
import { Battery, BellRing, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Device } from "@capacitor/device";
import { isMobile } from "@/lib/platform";
import { useNativeFeatures } from "@/hooks/use-native-features";
import { useHaptics } from "@/hooks/use-haptics";

export function MobileNativeBridge() {
  const native = useNativeFeatures();
  const haptics = useHaptics();
  const prevNetwork = useRef(native.networkStatus.connected);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Request notifications + prime native layer
  useEffect(() => {
    if (!isMobile()) return;
    native.requestNotificationPermission();
    const loadBattery = async () => {
      try {
        const info = await Device.getBatteryInfo();
        if (typeof info.batteryLevel === "number") {
          setBatteryLevel(Math.round(info.batteryLevel * 100));
        }
      } catch (err) {
        console.log("[MobileNativeBridge] battery info unavailable", err);
      }
    };
    loadBattery();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Network change feedback
  useEffect(() => {
    if (!isMobile()) return;
    const current = native.networkStatus.connected;
    if (prevNetwork.current !== current) {
      const label = current ? "Online" : "Offline";
      native.showToast(`Network: ${label}`);
      haptics.notification(current ? "success" : "warning");
      prevNetwork.current = current;
    }
  }, [native.networkStatus.connected, native, haptics]);

  if (!isMobile()) return null;

  const batteryText = batteryLevel !== null ? `${batteryLevel}%` : "--";

  const handleNotify = async () => {
    await native.sendLocalNotification("AeThex OS", "Synced with your device");
    await haptics.notification("success");
  };

  const handleToast = async () => {
    await native.showToast("AeThex is live on-device");
    await haptics.impact("light");
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-3 w-56 text-white drop-shadow-lg">
      <div className="rounded-2xl border border-emerald-400/30 bg-black/70 backdrop-blur-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-300 font-mono">
            <Smartphone className="w-4 h-4" />
            <span>Device Link</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-200">
            {native.networkStatus.connected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-300" />
            )}
            <span className="font-semibold uppercase text-[11px]">
              {native.networkStatus.connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-cyan-100 mb-2">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4" />
            <span>Battery</span>
          </div>
          <span className="font-semibold text-emerald-200">{batteryText}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleNotify}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition"
          >
            <BellRing className="w-4 h-4" />
            Notify
          </button>
          <button
            onClick={handleToast}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition"
          >
            Toast
          </button>
        </div>
      </div>
    </div>
  );
}
