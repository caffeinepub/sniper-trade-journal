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
    screenshot?: ExternalBlob;
    symbol: string;
    mainLesson: string;
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
    setupGrade: string;
    rrRatio: number;
    session: string;
    stopLoss: number;
    setupType: string;
    entryPrice: number;
    biasBeforeEntry: string;
    followedRules: boolean;
    exitedEarly: boolean;
    screenshot?: ExternalBlob;
    symbol: string;
    mainLesson: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTrade(input: TradeInput): Promise<Trade>;
    deleteTrade(id: string): Promise<boolean>;
    getAnalytics(): Promise<Analytics>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTradeById(id: string): Promise<Trade | null>;
    getTrades(): Promise<Array<Trade>>;
    getUniqueTags(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateTrade(id: string, input: TradeInput): Promise<Trade | null>;
}
