// Format money VND
export function formatVND(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(num) + "₫";
}
