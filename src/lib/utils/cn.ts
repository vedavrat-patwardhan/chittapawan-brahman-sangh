import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | false | undefined | null)[]): string {
  return twMerge(clsx(inputs));
}
