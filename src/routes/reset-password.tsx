import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SummitLogo } from "@/components/SummitLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Summit" },
      { name: "description", content: "Choose a new password for your Summit study account." },
      { property: "og:title", content: "Reset your password — Summit" },
      { property: "og:description", content: "Choose a new password for your Summit study account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
      <div className="aurora" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/auth" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="overlay-glass fade-in-up rounded-2xl p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <SummitLogo size={52} />
            <h1 className="text-2xl font-semibold tracking-tight gradient-text">Set a new password</h1>
          </div>
          {ready ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-surface/60"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </Button>
            </form>
          ) : (
            <p className="rounded-xl border border-border bg-surface/60 p-4 text-center text-sm text-muted-foreground">
              Open this page from the reset link in your email to choose a new password.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
