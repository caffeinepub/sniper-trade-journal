import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export interface Drill {
    id: string;
    marketShiftObservations: string;
    liquidityObservations: string;
    timeframe: string;
    entryAnalysis: string;
    owner: Principal;
    date: string;
    createdAt: bigint;
    structureNotes: string;
    drillType: string;
    updatedAt: bigint;
    induceNotes: string;
    screenshot?: ExternalBlob;
    symbol: string;
}
export interface Trade {
    id: string;
    result: string;
    direction: string;
    timeframe: string;
    pnlPercent: number;
    riskPercent: number;
    owner: Principal;
    date: string;
    psychAfter: Array<string>;
    psychBefore: Array<string>;
    takeProfit: number;
    createdAt: bigint;
    tags: Array<string>;
    movedStopLoss: boolean;
    psychDuring: Array<string>;
    entryReason: string;
    rMultiple: number;
    accountBalance: number;
    setupGrade: string;
    updatedAt: bigint;
    rrRatio: number;
    session: string;
    stopLoss: number;
    setupType: string;
    entryPrice: number;
    biasBeforeEntry: string;
    followedRules: boolean;
    exitedEarly: boolean;
    pnlDollar: number;
    screenshot?: ExternalBlob;
    symbol: string;
    mainLesson: string;
}
export interface TradeSegment {
    totalTrades: bigint;
    avgRR: number;
    segmentLabel: string;
    winRate: number;
}
export interface DrillInput {
    marketShiftObservations: string;
    liquidityObservations: string;
    timeframe: string;
    entryAnalysis: string;
    date: string;
    structureNotes: string;
    drillType: string;
    induceNotes: string;
    screenshot?: ExternalBlob;
    symbol: string;
}
export interface ExtendedAnalytics {
    totalTrades: bigint;
    avgRR: number;
    tradeSegments: Array<TradeSegment>;
    wins: bigint;
    exitedEarlyPercent: number;
    losses: bigint;
    totalNetR: number;
    avgLoss: number;
    sortedRMultiples: Array<number>;
    movedStopLossPercent: number;
    breakEvens: bigint;
    avgRMultiple: number;
    expectancy: number;
    winRate: number;
    followedRulesPercent: number;
    profitFactor: number;
    avgWin: number;
}
export interface Analytics {
    totalTrades: bigint;
    avgRR: number;
    wins: bigint;
    exitedEarlyPercent: number;
    losses: bigint;
    totalNetR: number;
    movedStopLossPercent: number;
    breakEvens: bigint;
    avgRMultiple: number;
    expectancy: number;
    winRate: number;
    followedRulesPercent: number;
    profitFactor: number;
}
export interface TradeInput {
    result: string;
    direction: string;
    timeframe: string;
    pnlPercent: number;
    riskPercent: number;
    date: string;
    psychAfter: Array<string>;
    psychBefore: Array<string>;
    takeProfit: number;
    tags: Array<string>;
    movedStopLoss: boolean;
    psychDuring: Array<string>;
    entryReason: string;
    rMultiple: number;
    accountBalance: number;
    setupGrade: string;
    rrRatio: number;
    session: string;
    stopLoss: number;
    setupType: string;
    entryPrice: number;
    biasBeforeEntry: string;
    followedRules: boolean;
    exitedEarly: boolean;
    pnlDollar: number;
    screenshot?: ExternalBlob;
    symbol: string;
    mainLesson: string;
}
export interface PlatformStats {
    totalTrades: bigint;
    totalUsersWithTrades: bigint;
    avgWinRate: number;
    mostActiveTrader: Principal;
}
export interface UserStats {
    totalTrades: bigint;
    avgRR: number;
    owner: Principal;
    wins: bigint;
    losses: bigint;
    totalNetR: number;
    avgRMultiple: number;
    winRate: number;
    mostRecentTradeDate: string;
}
export interface InstitutionalNews {
    id: string;
    institution: string;
    headline: string;
    summary: string;
    currency: string;
    sentiment: string;
    date: string;
    createdAt: bigint;
}
export interface InstitutionalNewsInput {
    institution: string;
    headline: string;
    summary: string;
    currency: string;
    sentiment: string;
    date: string;
}
export interface SentimentSummary {
    currency: string;
    sentiment: string;
    count: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminGetAllUsers(): Promise<Array<UserStats>>;
    adminGetPlatformStats(): Promise<PlatformStats>;
    adminGetUserStats(user: Principal): Promise<Analytics>;
    adminGetUserTrades(user: Principal): Promise<Array<Trade>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDrill(input: DrillInput): Promise<Drill>;
    createTrade(input: TradeInput): Promise<Trade>;
    createInstitutionalNews(input: InstitutionalNewsInput): Promise<InstitutionalNews>;
    deleteDrill(id: string): Promise<boolean>;
    deleteTrade(id: string): Promise<boolean>;
    deleteInstitutionalNews(id: string): Promise<boolean>;
    getAnalytics(): Promise<Analytics>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDrillById(id: string): Promise<Drill | null>;
    getDrills(): Promise<Array<Drill>>;
    getExtendedAnalytics(): Promise<ExtendedAnalytics>;
    getInstitutionalNews(): Promise<Array<InstitutionalNews>>;
    getInstitutionalSentimentSummary(): Promise<Array<SentimentSummary>>;
    getTradeById(id: string): Promise<Trade | null>;
    getTrades(): Promise<Array<Trade>>;
    getUniqueTags(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdminAssigned(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateDrill(id: string, input: DrillInput): Promise<Drill | null>;
    updateTrade(id: string, input: TradeInput): Promise<Trade | null>;
}
