export function formatCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR")}원`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function getGradeBadgeClass(grade: string): string {
  switch (grade) {
    case "S":
      return "bg-emerald-100 text-emerald-700";
    case "A":
      return "bg-blue-100 text-blue-700";
    case "B":
      return "bg-amber-100 text-amber-700";
    case "C":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getPrioritySignalBadgeClass(signal: string): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-emerald-100 text-emerald-700";
    case "BUY_CANDIDATE":
      return "bg-blue-100 text-blue-700";
    case "WATCH":
      return "bg-amber-100 text-amber-700";
    case "EXCLUDE":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getPublicActionBadgeClass(action: string): string {
  switch (action) {
    case "BUY":
      return "bg-emerald-100 text-emerald-700";
    case "HOLD":
      return "bg-slate-100 text-slate-700";
    case "SELL":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getTradeBadgeClass(type: string): string {
  switch (type) {
    case "BUY":
      return "bg-emerald-100 text-emerald-700";
    case "SELL":
      return "bg-rose-100 text-rose-700";
    case "HOLD":
      return "bg-slate-100 text-slate-700";
    case "CHECK":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getHoldingDecisionBadgeClass(decision: string): string {
  switch (decision) {
    case "추가매수":
      return "bg-emerald-100 text-emerald-700";
    case "유지":
      return "bg-slate-100 text-slate-700";
    case "일부매도":
    case "전량매도":
      return "bg-rose-100 text-rose-700";
    case "관찰강화":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function buildLinePath(
  values: number[],
  width: number,
  height: number
): string {
  if (values.length === 0) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}