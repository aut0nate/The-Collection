import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/tools");

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-paper transition hover:border-accent/50 hover:bg-white/[0.06]"
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
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to collection
      </Link>
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-panel p-8 shadow-glow">
        <Image
          src="/brand/the-collection-logo.png"
          alt=""
          className="mx-auto h-16 w-16"
          width={64}
          height={64}
        />
        <h1 className="mt-6 text-center text-3xl font-semibold text-paper">THE COLLECTION</h1>
        <p className="mt-2 text-center text-base text-mist">Sign in to your collection</p>
        <LoginForm />
      </section>
    </main>
  );
}
