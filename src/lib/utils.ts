import { type ClassValue, clsx } from "clsx";

// If you don't have `clsx` installed yet, install it with:
// npm i clsx
// This file is kept minimal and compatible with shadcn-style `cn()`.

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

