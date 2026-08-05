import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const GRADIENT_KEY = "study-hub-gradient-intensity-v1";
const MOTION_KEY = "summit-reduce-motion-v1";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Summit" },
      { name: "description", content: "Tune the Summit aurora, motion and account security — password resets and sync options." },
      { property: "og:title", content: "Settings — Summit" },
      { property: "og:description", content: "Tune the Summit aurora, motion and account security — password resets and sync options." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useProfile();
  const [intensity, setIntensity] = useState(60);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const g = Number(localStorage.getItem(GRADIENT_KEY));
    if (!Number.isNaN(g) && g > 0) setIntensity(g);
    setReduceMotion(localStorage.getItem(MOTION_KEY) === "1");
  }, []);

  function applyIntensity(v: number) {
    setIntensity(v);
    localStorage.setItem(GRADIENT_KEY, String(v));
    document.documentElement.style.setProperty("--aurora-strength", String(v / 100));
  }

  function applyMotion(on: boolean) {
    setReduceMotion(on);
    localStorage.setItem(MOTION_KEY, on ? "1" : "0");
    document.documentElement.classList.toggle("reduce-motion", on);
  }

  async function sendReset() {
    if (!user?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email.");
  }

  async function clearLocal() {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("study-hub-") || key.startsWith("summit-") || key.startsWith("atlas-")) {
        localStorage.removeItem(key);
      }
    }
    toast.success("This device's copy cleared — your account data stays safe.");
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <AccountShell title="Settings" subtitle="Appearance, motion and account security.">
      <Panel title="Appearance">
        <div className="space-y-6">
          <div>
            <Label>Aurora intensity</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              How strong the purple gradient glow sits behind the app.
            </p>
            <Slider
              value={[intensity]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => applyIntensity(v[0] ?? 60)}
            />
            <div className="mt-2 text-xs text-muted-foreground">{intensity}%</div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <Label>Reduce motion</Label>
              <p className="text-xs text-muted-foreground">Calms parallax, floating and pulse animations.</p>
            </div>
            <Switch checked={reduceMotion} onCheckedChange={applyMotion} />
          </div>
        </div>
      </Panel>

      <Panel title="Account">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <div className="font-medium">Password</div>
              <p className="text-xs text-muted-foreground">Send a reset link to {user?.email}.</p>
            </div>
            <Button variant="outline" onClick={sendReset} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset password
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <div className="font-medium">Clear this device</div>
              <p className="text-xs text-muted-foreground">
                Wipes the local copy and re-pulls everything from your account.
              </p>
            </div>
            <Button variant="outline" onClick={clearLocal} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </Panel>
    </AccountShell>
  );
}
