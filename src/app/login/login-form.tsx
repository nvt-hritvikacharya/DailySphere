"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Smartphone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

type Mode = "email" | "phone";

export function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("email");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"identify" | "verify">("identify");
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);

  const payload = mode === "email" ? { email: identifier.trim() } : { phone: identifier.replace(/[\s-]/g, "") };

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api<{ demo: boolean }>("/api/auth/otp", { method: "POST", json: payload });
      setDemo(r.demo);
      setStep("verify");
      toast.success(r.demo ? "Demo mode: use code 123456" : `Code sent to ${identifier}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api<{ onboarded: boolean }>("/api/auth/verify", { method: "POST", json: { ...payload, token: code } });
      window.location.assign(r.onboarded ? "/" : "/onboarding");
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <p className="font-heading text-xl font-semibold lg:hidden">DailySphere</p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight">
          {step === "identify" ? "Welcome back" : "Check your " + (mode === "email" ? "inbox" : "messages")}
        </h2>
        <p className="text-muted-foreground">
          {step === "identify" ? "Sign in or create an account with a one-time code." : `Enter the 6-digit code sent to ${identifier}.`}
        </p>
        {params.get("expired") && step === "identify" && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Your session expired after an hour of inactivity. Please sign in again.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "identify" ? (
          <motion.form key="id" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={sendCode} className="space-y-5">
            <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setIdentifier(""); }}>
              <TabsList className="w-full">
                <TabsTrigger value="email" className="flex-1"><Mail /> Email</TabsTrigger>
                <TabsTrigger value="phone" className="flex-1"><Smartphone /> Phone</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <Label htmlFor="identifier">{mode === "email" ? "Email address" : "Phone number"}</Label>
              <Input
                id="identifier"
                autoFocus
                required
                type={mode === "email" ? "email" : "tel"}
                autoComplete={mode === "email" ? "email" : "tel"}
                placeholder={mode === "email" ? "you@example.com" : "+91 98765 43210"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading || !identifier}>
              {loading && <Loader2 className="animate-spin" />} Send code
            </Button>
          </motion.form>
        ) : (
          <motion.form key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={verify} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
              />
              {demo && <p className="text-xs text-muted-foreground">Supabase isn&apos;t configured — demo code is <b>123456</b>.</p>}
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading || code.length !== 6}>
              {loading && <Loader2 className="animate-spin" />} Verify & continue
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep("identify"); setCode(""); }}>
              <ArrowLeft /> Use a different {mode}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
