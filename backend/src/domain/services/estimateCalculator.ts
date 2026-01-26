import type { EstimateItem, EstimatePayload, TaxRounding } from "../entities/EstimatePayload.js";

export interface ComputedItem {
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  spec: string;
  amount: number;
}

export interface ComputedEstimate {
  items: ComputedItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  rounding: TaxRounding;
}

const toNumber = (value: number | string | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const escapeHtml = (value: string | undefined) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const roundTax = (value: number, mode: TaxRounding) => {
  if (!Number.isFinite(value)) return 0;
  if (mode === "floor") return Math.floor(value);
  if (mode === "ceil") return Math.ceil(value);
  return Math.round(value);
};

export function computeEstimate(payload: EstimatePayload): ComputedEstimate {
  const taxRate = toNumber(payload.taxRate || 0.1);
  const rounding = (payload.taxRounding ?? "round") as TaxRounding;
  const items = (payload.items ?? []).map((item: EstimateItem) => {
    const unitPrice = toNumber(item.unitPrice);
    const quantity = toNumber(item.quantity);
    const hasAmount = item.amount !== undefined && item.amount !== null && item.amount !== "";
    const amount = hasAmount ? Math.round(toNumber(item.amount)) : Math.round(unitPrice * quantity);
    return {
      name: escapeHtml(item.name),
      unitPrice,
      quantity,
      unit: escapeHtml(item.unit),
      spec: escapeHtml(item.spec),
      amount
    };
  });

  const subtotal = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const tax = roundTax(subtotal * taxRate, rounding);
  const total = subtotal + tax;

  return { items, subtotal, tax, total, taxRate, rounding };
}

export const yen = (value: number) => new Intl.NumberFormat("ja-JP").format(Math.round(value));

export const resolveDate = (value?: string) => {
  const input = value || new Date().toISOString().slice(0, 10);
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return input;

  // Reiwa era starts on 2019-05-01 (2019-04-30 15:00:00Z).
  const reiwaStart = new Date("2019-05-01T00:00:00");
  if (date >= reiwaStart) {
    const year = date.getFullYear() - 2018;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `R${year}年${month}月${day}日`;
  }

  return input;
};

