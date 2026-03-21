import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PushTest() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [devices, setDevices] = useState(null);

  useEffect(() => {
    const runDiag = async () => {
      const diag = {
        isMedian: !!(window.median),
        medianKeys: window.median ? Object.keys(window.median) : [],
        hasOneSignalBridge: !!(window.median?.onesignal),
        userAgent: navigator.userAgent.slice(0, 100),
        oneSignalInfo: null,
      };

      // Try to get OneSignal info via Median bridge
      if (window.median?.onesignal?.info) {
        try {
          const info = await window.median.onesignal.info();
          diag.oneSignalInfo = info;
        } catch (e) {
          diag.oneSignalInfoError = e.message;
        }
      }

      setDiagnostics(diag);
    };

    runDiag();
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await base44.functions.invoke("debugPush", {});
      setDevices(res.data);
    } catch (e) {
      setDevices({ error: e.message });
    }
  };

  const handleForceRegister = async () => {
    if (!email) return;
    setLoading(true);
    setStatus(null);
    try {
      if (!window.median?.onesignal) {
        setStatus({ ok: false, data: "window.median.onesignal is undefined!\nNot running inside Median native app." });
        setLoading(false);
        return;
      }

      // Login user via Median bridge
      await window.median.onesignal.login(email);
      await new Promise(r => setTimeout(r, 2000));

      const osInfo = await window.median.onesignal.info();
      const playerId = osInfo?.subscription?.id || osInfo?.oneSignalId;

      if (!playerId) {
        setStatus({ ok: false, data: `Logged in but no subscription ID yet.\noneSignalInfo: ${JSON.stringify(osInfo, null, 2)}` });
        setLoading(false);
        return;
      }

      // Save to DB
      const existing = await base44.entities.PushDevice.filter({ onesignal_player_id: playerId }, '-created_date', 1);
      if (existing.length > 0) {
        await base44.entities.PushDevice.update(existing[0].id, { user_id: email, last_seen_at: new Date().toISOString(), is_enabled: true });
      } else {
        await base44.entities.PushDevice.create({ user_id: email, onesignal_player_id: playerId, platform: 'android', is_enabled: true, last_seen_at: new Date().toISOString() });
      }

      setStatus({ ok: true, data: `Registered!\nSubscription ID: ${playerId}\nFull info: ${JSON.stringify(osInfo, null, 2)}` });
      await loadDevices();
    } catch (e) {
      setStatus({ ok: false, data: e.message });
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!email) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await base44.functions.invoke("send_push_onesignal", {
        user_id: email,
        title: "Test Notification",
        message: "This is a test push notification!",
        type: "general"
      });
      setStatus({ ok: true, data: JSON.stringify(res.data, null, 2) });
    } catch (e) {
      setStatus({ ok: false, data: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#001a0a] p-4 space-y-4 overflow-y-auto">
      <h1 className="text-white text-xl font-bold">Push Debug</h1>

      {/* Diagnostics */}
      <div className="bg-[#0a1a0a] border border-yellow-700 rounded-xl p-4">
        <h2 className="text-yellow-400 font-bold mb-2 text-sm">Device Diagnostics</h2>
        {diagnostics ? (
          <pre className="text-yellow-200 text-xs whitespace-pre-wrap font-mono">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-400 text-xs">Loading...</p>
        )}
      </div>

      {/* Registered Devices */}
      <div className="bg-[#0a1a0a] border border-blue-700 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-blue-400 font-bold text-sm">PushDevice Records ({devices?.total_devices ?? '?'})</h2>
          <Button onClick={loadDevices} className="text-xs h-6 px-2 bg-blue-900">Refresh</Button>
        </div>
        <pre className="text-blue-200 text-xs whitespace-pre-wrap font-mono">
          {devices ? JSON.stringify(devices.devices || devices, null, 2) : 'Loading...'}
        </pre>
      </div>

      {/* Actions */}
      <div className="bg-[#0a1a0a] border border-green-800 rounded-xl p-4 space-y-3">
        <Input
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#0f2a0f] border-green-800 text-white"
        />
        <Button onClick={handleForceRegister} disabled={loading || !email} className="w-full bg-yellow-700 hover:bg-yellow-600 text-white">
          {loading ? "Working..." : "Force Register This Device"}
        </Button>
        <Button onClick={handleTest} disabled={loading || !email} className="w-full btn-primary">
          {loading ? "Sending..." : "Send Test Push"}
        </Button>
      </div>

      {status && (
        <div className={`rounded-lg p-4 text-sm font-mono whitespace-pre-wrap ${status.ok ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
          {status.data}
        </div>
      )}
    </div>
  );
}