import { roundCents } from "@/utils/currency";

/**
 * Developer platform share of gross profit on completed (Delivered) orders.
 * Change this one value to adjust the agreement everywhere (checkout, API, dashboard).
 */
export const DEVELOPER_SHARE_RATE = 0.25;

export interface ProfitLine {
  unitPriceUSD: number;
  unitBuyingPriceUSD: number;
  quantity: number;
}

export function lineGrossProfit({ unitPriceUSD, unitBuyingPriceUSD, quantity }: ProfitLine): number {
  return roundCents(Math.max(0, unitPriceUSD - unitBuyingPriceUSD) * quantity);
}

export function developerShare(grossProfitUSD: number): number {
  return roundCents(grossProfitUSD * DEVELOPER_SHARE_RATE);
}

export const DEVELOPER_SHARE_PERCENT = Math.round(DEVELOPER_SHARE_RATE * 100);
export const STORE_SHARE_PERCENT = 100 - DEVELOPER_SHARE_PERCENT;
