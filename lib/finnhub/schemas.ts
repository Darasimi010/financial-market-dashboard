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

/**
 * USPTO Patent schema (/stock/uspto-patent)
 */
export const FinnhubPatentItemSchema = z.object({
  applicationNumber: z.string().optional(),
  companyFilingName: z.array(z.string()).optional(),
  description: z.string().optional(),
  filingDate: z.string().optional(),
  filingStatus: z.string().optional(),
  patentNumber: z.string().optional(),
  patentType: z.string().optional(),
  publicationDate: z.string().optional(),
  url: z.string().optional(),
});
export type FinnhubPatentItem = z.infer<typeof FinnhubPatentItemSchema>;
export const FinnhubPatentsResponseSchema = z.object({
  data: z.array(FinnhubPatentItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubPatentsResponse = z.infer<typeof FinnhubPatentsResponseSchema>;

/**
 * Visa Application schema (/stock/visa-application)
 */
export const FinnhubVisaItemSchema = z.object({
  year: z.number().optional(),
  quarter: z.number().optional(),
  symbol: z.string().optional(),
  caseNumber: z.string().optional(),
  caseStatus: z.string().optional(),
  receivedDate: z.string().optional(),
  visaClass: z.string().optional(),
  jobTitle: z.string().optional(),
  socCode: z.string().optional(),
  fullTimePosition: z.string().optional(),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  employerName: z.string().optional(),
  worksiteAddress: z.string().optional(),
  worksiteCity: z.string().optional(),
  worksiteCounty: z.string().optional(),
  worksiteState: z.string().optional(),
  worksitePostalCode: z.string().optional(),
  wageRangeFrom: z.number().nullable().optional(),
  wageRangeTo: z.number().nullable().optional(),
  wageUnitOfPay: z.string().optional(),
  wageLevel: z.string().optional(),
  h1bDependent: z.string().optional(),
});
export type FinnhubVisaItem = z.infer<typeof FinnhubVisaItemSchema>;
export const FinnhubVisaResponseSchema = z.object({
  data: z.array(FinnhubVisaItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubVisaResponse = z.infer<typeof FinnhubVisaResponseSchema>;

/**
 * Senate Lobbying schema (/stock/lobbying)
 */
export const FinnhubLobbyingItemSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  year: z.number().optional(),
  period: z.string().optional(),
  documentUrl: z.string().optional(),
  income: z.number().nullable().optional(),
  expenses: z.number().nullable().optional(),
  postedName: z.string().optional(),
  date: z.string().optional(),
  clientId: z.string().optional(),
  registrantId: z.string().optional(),
  senateId: z.string().optional(),
  houseRegistrantId: z.string().optional(),
});
export type FinnhubLobbyingItem = z.infer<typeof FinnhubLobbyingItemSchema>;
export const FinnhubLobbyingResponseSchema = z.object({
  data: z.array(FinnhubLobbyingItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubLobbyingResponse = z.infer<typeof FinnhubLobbyingResponseSchema>;

/**
 * USA Spending schema (/stock/usa-spending)
 */
export const FinnhubSpendingItemSchema = z.object({
  symbol: z.string().optional(),
  recipientName: z.string().optional(),
  recipientParentName: z.string().optional(),
  country: z.string().optional(),
  totalValue: z.number().nullable().optional(),
  outlayedAmount: z.number().nullable().optional(),
  obligatedAmount: z.number().nullable().optional(),
  potentialAmount: z.number().nullable().optional(),
  actionDate: z.string().optional(),
  performanceStartDate: z.string().optional(),
  performanceEndDate: z.string().optional(),
  awardingAgencyName: z.string().optional(),
  awardingSubAgencyName: z.string().optional(),
  awardingOfficeName: z.string().optional(),
  performanceCountry: z.string().optional(),
  performanceCity: z.string().optional(),
  performanceCounty: z.string().optional(),
  performanceState: z.string().optional(),
  performanceZipCode: z.string().optional(),
  performanceCongressionalDistrict: z.string().optional(),
  awardDescription: z.string().optional(),
  naicsCode: z.string().optional(),
  permalink: z.string().optional(),
  lastModifiedDate: z.string().optional(),
});
export type FinnhubSpendingItem = z.infer<typeof FinnhubSpendingItemSchema>;
export const FinnhubSpendingResponseSchema = z.object({
  data: z.array(FinnhubSpendingItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubSpendingResponse = z.infer<typeof FinnhubSpendingResponseSchema>;

/**
 * Earnings Calendar schema (/calendar/earnings)
 */
export const FinnhubEarningsCalendarItemSchema = z.object({
  date: z.string().optional(),
  epsActual: z.number().nullable().optional(),
  epsEstimate: z.number().nullable().optional(),
  hour: z.string().optional(),
  quarter: z.number().optional(),
  revenueActual: z.number().nullable().optional(),
  revenueEstimate: z.number().nullable().optional(),
  symbol: z.string(),
  year: z.number().optional(),
});
export type FinnhubEarningsCalendarItem = z.infer<typeof FinnhubEarningsCalendarItemSchema>;
export const FinnhubEarningsCalendarResponseSchema = z.object({
  earningsCalendar: z.array(FinnhubEarningsCalendarItemSchema).optional().default([]),
});
export type FinnhubEarningsCalendarResponse = z.infer<typeof FinnhubEarningsCalendarResponseSchema>;

/**
 * IPO Calendar schema (/calendar/ipo)
 */
export const FinnhubIpoItemSchema = z.object({
  date: z.string().optional(),
  exchange: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  numberOfShares: z.number().nullable().optional(),
  price: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  symbol: z.string().nullable().optional(),
  totalSharesValue: z.number().nullable().optional(),
});
export type FinnhubIpoItem = z.infer<typeof FinnhubIpoItemSchema>;
export const FinnhubIpoCalendarResponseSchema = z.object({
  ipoCalendar: z.array(FinnhubIpoItemSchema).optional().default([]),
});
export type FinnhubIpoCalendarResponse = z.infer<typeof FinnhubIpoCalendarResponseSchema>;

/**
 * SEC Filings schema (/stock/filings)
 */
export const FinnhubFilingItemSchema = z.object({
  accessNumber: z.string().optional(),
  symbol: z.string().optional(),
  cik: z.string().optional(),
  form: z.string().optional(),
  filedDate: z.string().optional(),
  acceptedDate: z.string().optional(),
  reportUrl: z.string().optional(),
  filingUrl: z.string().optional(),
});
export type FinnhubFilingItem = z.infer<typeof FinnhubFilingItemSchema>;
export const FinnhubFilingsArraySchema = z.array(FinnhubFilingItemSchema);

/**
 * Financials As Reported schema (/stock/financials-reported)
 */
export const FinnhubFinancialsReportedItemSchema = z.object({
  accessNumber: z.string().optional(),
  symbol: z.string().optional(),
  cik: z.string().optional(),
  year: z.number().optional(),
  quarter: z.number().optional(),
  form: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  filedDate: z.string().optional(),
  acceptedDate: z.string().optional(),
  report: z.record(z.string(), z.any()).optional(),
});
export type FinnhubFinancialsReportedItem = z.infer<typeof FinnhubFinancialsReportedItemSchema>;
export const FinnhubFinancialsReportedResponseSchema = z.object({
  cik: z.string().optional(),
  data: z.array(FinnhubFinancialsReportedItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubFinancialsReportedResponse = z.infer<
  typeof FinnhubFinancialsReportedResponseSchema
>;

/**
 * Insider Sentiment schema (/stock/insider-sentiment)
 */
export const FinnhubInsiderSentimentItemSchema = z.object({
  symbol: z.string().optional(),
  year: z.number().optional(),
  month: z.number().optional(),
  change: z.number().nullable().optional(),
  mspr: z.number().nullable().optional(),
});
export type FinnhubInsiderSentimentItem = z.infer<typeof FinnhubInsiderSentimentItemSchema>;
export const FinnhubInsiderSentimentResponseSchema = z.object({
  data: z.array(FinnhubInsiderSentimentItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubInsiderSentimentResponse = z.infer<typeof FinnhubInsiderSentimentResponseSchema>;

/**
 * Insider Transactions schema (/stock/insider-transactions)
 */
export const FinnhubInsiderTransactionItemSchema = z.object({
  name: z.string().optional(),
  share: z.number().nullable().optional(),
  change: z.number().nullable().optional(),
  filingDate: z.string().optional(),
  transactionDate: z.string().optional(),
  transactionCode: z.string().optional(),
  transactionPrice: z.number().nullable().optional(),
  id: z.string().optional(),
  symbol: z.string().optional(),
  source: z.string().optional(),
  isDerivative: z.boolean().optional(),
  currency: z.string().optional(),
});
export type FinnhubInsiderTransactionItem = z.infer<typeof FinnhubInsiderTransactionItemSchema>;
export const FinnhubInsiderTransactionsResponseSchema = z.object({
  data: z.array(FinnhubInsiderTransactionItemSchema).optional().default([]),
  symbol: z.string().optional(),
});
export type FinnhubInsiderTransactionsResponse = z.infer<
  typeof FinnhubInsiderTransactionsResponseSchema
>;

/**
 * Market Holiday schema (/stock/market-holiday)
 */
export const FinnhubMarketHolidayItemSchema = z.object({
  eventName: z.string(),
  atDate: z.string(),
  tradingHour: z.string().optional(),
  postMarket: z.string().optional(),
});
export type FinnhubMarketHolidayItem = z.infer<typeof FinnhubMarketHolidayItemSchema>;
export const FinnhubMarketHolidayResponseSchema = z.object({
  data: z.array(FinnhubMarketHolidayItemSchema).optional().default([]),
  exchange: z.string().optional(),
  timezone: z.string().optional(),
});
export type FinnhubMarketHolidayResponse = z.infer<typeof FinnhubMarketHolidayResponseSchema>;
