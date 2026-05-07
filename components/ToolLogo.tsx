export function ToolLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-2" loading="lazy" />
      ) : (
        <span className="text-sm font-semibold text-accent">{initials}</span>
      )}
    </div>
  );
}
