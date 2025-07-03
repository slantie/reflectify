export function formatTimeSlot(slot: number): string {
  const startTime = 9 + Math.floor(slot - 1);
  return `${startTime}:00 - ${startTime + 1}:00`;
}

import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
