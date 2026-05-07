import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-paper">The Collection Admin</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-mist transition hover:border-accent/40 hover:bg-accent/10 hover:text-paper"
          >
            View Collection
          </Link>
          <form action={logoutAction}>
            <button className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-mist hover:text-paper">
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </main>
  );
}
