import { LogInIcon } from "@/components/AuthIcons";

export function LoginForm({ error }: { error?: string }) {
  return (
    <div className="mt-8 space-y-5">
      {error ? (
        <p className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
      ) : null}
      <a
        href="/admin/auth/login"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-paper transition hover:border-accent/50 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogInIcon />
        Sign in with Authentik
      </a>
    </div>
  );
}
