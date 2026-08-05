import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Make a pasted link safe to open in a new tab (adds https:// when no scheme). */
export function normalizeUrl(raw?: string | null): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (/^(https?:|mailto:)/i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
}
