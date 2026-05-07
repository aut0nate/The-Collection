"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import { LogInIcon } from "@/components/AuthIcons";

export function LoginForm() {
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.error ? (
        <p className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.error}</p>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold text-paper">Username</span>
        <input
          name="username"
          autoComplete="username"
          required
          className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-paper">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60"
        />
      </label>
      <button
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-paper transition hover:border-accent/50 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogInIcon />
        {pending ? "Logging In..." : "Log In"}
      </button>
    </form>
  );
}
