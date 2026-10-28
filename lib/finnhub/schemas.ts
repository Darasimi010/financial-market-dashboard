import { z } from 'zod';

/**
 * Quote schema
 * c: current price, h: high of day, l: low of day, o: open price of day,
 * pc: previous close, d: change, dp: percent change, t: unix timestamp
 */
export const FinnhubQuoteSchema = z.object({
  c: z.number(),
  h: z.number(),
  l: z.number(),
  o: z.number(),
  pc: z.number(),
  d: z.number().nullable().optional(),
  dp: z.number().nullable().optional(),
  t: z.number().optional(),
});
export type FinnhubQuote = z.infer<typeof FinnhubQuoteSchema>;

/**
 * Company Profile 2 schema (Free endpoint: /stock/profile2)
 */
export const FinnhubCompanyProfile2Schema = z.object({
  country: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  exchange: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  ticker: z.string().nullable().optional(),
  ipo: z.string().nullable().optional(),
  marketCapitalization: z.number().nullable().optional(),
  shareOutstanding: z.number().nullable().optional(),
  logo: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  weburl: z.string().nullable().optional(),
  finnhubIndustry: z.string().nullable().optional(),
});
export type FinnhubCompanyProfile2 = z.infer<typeof FinnhubCompanyProfile2Schema>;

/**
 * Symbol Lookup Info schema (/search)
 */
export const FinnhubSymbolLookupInfoSchema = z.object({
  description: z.string(),
  displaySymbol: z.string(),
  symbol: z.string(),
  type: z.string(),
});
export type FinnhubSymbolLookupInfo = z.infer<typeof FinnhubSymbolLookupInfoSchema>;

export const FinnhubSymbolLookupSchema = z.object({
  count: z.number(),
  result: z.array(FinnhubSymbolLookupInfoSchema),
});
export type FinnhubSymbolLookup = z.infer<typeof FinnhubSymbolLookupSchema>;

/**
 * Market Status schema (/stock/market-status)
 */
export const FinnhubMarketStatusSchema = z.object({
  exchange: z.string(),
  timezone: z.string().optional(),
  session: z.string().nullable().optional(),
  holiday: z.string().nullable().optional(),
  isOpen: z.boolean(),
  t: z.number().optional(),
});
export type FinnhubMarketStatus = z.infer<typeof FinnhubMarketStatusSchema>;

/**
 * Market News schema (/news and /company-news)
 */
export const FinnhubNewsItemSchema = z.object({
  category: z.string().optional(),
  datetime: z.number(),
  headline: z.string(),
  id: z.number(),
  image: z.string().nullable().optional(),
  related: z.string().optional(),
  source: z.string(),
  summary: z.string(),
  url: z.string(),
});
export type FinnhubNewsItem = z.infer<typeof FinnhubNewsItemSchema>;
export const FinnhubNewsArraySchema = z.array(FinnhubNewsItemSchema);

/**
 * Stock Candles schema (/stock/candle)
 */
export const FinnhubCandlesSchema = z.object({
  c: z.array(z.number()),
  h: z.array(z.number()),
  l: z.array(z.number()),
  o: z.array(z.number()),
  s: z.string(), // "ok" or "no_data"
  t: z.array(z.number()),
  v: z.array(z.number()).optional(),
});
export type FinnhubCandles = z.infer<typeof FinnhubCandlesSchema>;

/**
 * Company Peers schema (/stock/peers)
 */
export const FinnhubPeersSchema = z.array(z.string());

/**
 * Basic Financials schema (/stock/metric)
 */
export const FinnhubBasicFinancialsSchema = z.object({
  symbol: z.string(),
  metricType: z.string().optional(),
  metric: z.record(z.string(), z.any()).optional(),
  series: z.record(z.string(), z.any()).optional(),
});
export type FinnhubBasicFinancials = z.infer<typeof FinnhubBasicFinancialsSchema>;

/**
 * Recommendation Trends schema (/stock/recommendation)
 */
export const FinnhubRecommendationSchema = z.object({
  buy: z.number(),
  hold: z.number(),
  period: z.string(),
  sell: z.number(),
  strongBuy: z.number(),
  strongSell: z.number(),
  symbol: z.string(),
});
export type FinnhubRecommendation = z.infer<typeof FinnhubRecommendationSchema>;
export const FinnhubRecommendationArraySchema = z.array(FinnhubRecommendationSchema);

/**
 * Earnings Surprise schema (/stock/earnings)
 */
export const FinnhubEarningsSurpriseSchema = z.object({
  actual: z.number().nullable().optional(),
  estimate: z.number().nullable().optional(),
  period: z.string(),
  quarter: z.number().optional(),
  surprise: z.number().nullable().optional(),
  surprisePercent: z.number().nullable().optional(),
  symbol: z.string(),
  year: z.number().optional(),
});
export type FinnhubEarningsSurprise = z.infer<typeof FinnhubEarningsSurpriseSchema>;
export const FinnhubEarningsSurpriseArraySchema = z.array(FinnhubEarningsSurpriseSchema);
