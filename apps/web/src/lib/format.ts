import { format } from "date-fns";

export function formatDate(value: Date | string) {
  return format(new Date(value), "LLL dd, y HH:mm");
}

export function formatLatency(milliseconds: number) {
  if (milliseconds >= 1000) {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(milliseconds / 1000)}s`;
  }

  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(milliseconds)}ms`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}
