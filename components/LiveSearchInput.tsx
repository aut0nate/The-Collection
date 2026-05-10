"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type LiveSearchInputProps = {
  className: string;
  defaultValue: string;
  label: string;
  placeholder: string;
};

const debounceMs = 250;

export function LiveSearchInput({ className, defaultValue, label, placeholder }: LiveSearchInputProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const lastPushedQuery = useRef(defaultValue.trim());
  const [, startTransition] = useTransition();

  useEffect(() => {
    const nextDefaultValue = defaultValue.trim();

    if (nextDefaultValue !== lastPushedQuery.current) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    const nextQuery = value.trim();
    const currentQuery = searchParams.get("q")?.trim() || "";

    if (nextQuery === currentQuery) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      const search = params.toString();
      lastPushedQuery.current = nextQuery;
      startTransition(() => {
        router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
      });
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, value]);

  return (
    <label className="block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
    </label>
  );
}
