import Image from "next/image";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";

export async function PublicHeader() {
  const session = await getAdminSession();
  const adminHref = session ? "/admin/tools" : "/admin/login";
  const adminLabel = session ? "Manage" : "Log in";

  return (
    <header className="border-b border-white/10 bg-ink/78 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-4" aria-label="The Collection homepage">
          <Image
            src="/brand/the-collection-logo.png"
            alt=""
            className="h-16 w-16"
            width={64}
            height={64}
          />
          <span className="text-2xl font-semibold text-paper">The Collection</span>
        </Link>
        <Link
          href={adminHref}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-paper transition hover:border-accent/50 hover:bg-white/[0.06]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="m10 17 5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
          {adminLabel}
        </Link>
      </div>
    </header>
  );
}
