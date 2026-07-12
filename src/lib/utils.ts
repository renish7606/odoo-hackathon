import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currencyCode: string = "USD", compact: boolean = false, rate: number = 1) {
  const convertedValue = value * rate;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard"
  }).format(convertedValue);
}
