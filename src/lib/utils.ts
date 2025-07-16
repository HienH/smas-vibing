import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @description Converts a Firestore Timestamp, ISO string, or number to a JavaScript Date object.
 * @param val - The value to convert (Timestamp, string, or number).
 * @returns {Date} The JavaScript Date object.
 */
export function toDate(val: any): Date {
  if (val?.toDate) return val.toDate();
  return new Date(val);
}
