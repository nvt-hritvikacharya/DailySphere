import { Suspense } from "react";
import { authMode } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-rose-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-80 rounded-full bg-amber-300/20 blur-3xl" />
        <p className="relative font-heading text-2xl font-semibold tracking-tight">DailySphere</p>
        <div className="relative space-y-6">
          <h1 className="font-heading text-5xl leading-tight font-semibold text-balance">
            Your world, briefed beautifully every morning.
          </h1>
          <p className="max-w-md text-lg text-white/75">
            Stories picked for your interests, a word to learn, a moment from history, and five questions to sharpen your mind.
          </p>
        </div>
        <p className="relative text-sm text-white/60">Fresh content at 12:00 AM — in your time zone.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <Suspense>
          <LoginForm mode={authMode()} />
        </Suspense>
      </section>
    </main>
  );
}
