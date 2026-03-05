import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Old types
  type OldTrade = {
    id : Text;
    owner : Principal;
    date : Text;
    symbol : Text;
    session : Text;
    timeframe : Text;
    direction : Text;
    biasBeforeEntry : Text;
    setupType : Text;
    entryReason : Text;
    entryPrice : Float;
    stopLoss : Float;
    takeProfit : Float;
    riskPercent : Float;
    rrRatio : Float;
    rMultiple : Float;
    pnlPercent : Float;
    result : Text;
    psychBefore : [Text];
    psychDuring : [Text];
    psychAfter : [Text];
    followedRules : Bool;
    exitedEarly : Bool;
    movedStopLoss : Bool;
    setupGrade : Text;
    mainLesson : Text;
    tags : [Text];
    screenshot : ?Storage.ExternalBlob;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldDrill = {
    id : Text;
    owner : Principal;
    date : Text;
    symbol : Text;
    timeframe : Text;
    drillType : Text;
    structureNotes : Text;
    liquidityObservations : Text;
    induceNotes : Text;
    marketShiftObservations : Text;
    entryAnalysis : Text;
    screenshot : ?Storage.ExternalBlob;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldAnalytics = {
    totalTrades : Nat;
    wins : Nat;
    losses : Nat;
    breakEvens : Nat;
    winRate : Float;
    avgRR : Float;
    avgRMultiple : Float;
    totalNetR : Float;
    profitFactor : Float;
    expectancy : Float;
    followedRulesPercent : Float;
    exitedEarlyPercent : Float;
    movedStopLossPercent : Float;
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    trades : Map.Map<Text, OldTrade>;
    drills : Map.Map<Text, OldDrill>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  // New types
  type NewTrade = OldTrade;
  type NewDrill = OldDrill;
  type NewAnalytics = OldAnalytics;
  type NewUserProfile = OldUserProfile;

  type UserStats = {
    owner : Principal;
    totalTrades : Nat;
    wins : Nat;
    losses : Nat;
    winRate : Float;
    avgRR : Float;
    avgRMultiple : Float;
    totalNetR : Float;
    mostRecentTradeDate : Text;
  };

  type PlatformStats = {
    totalUsersWithTrades : Nat;
    totalTrades : Nat;
    avgWinRate : Float;
    mostActiveTrader : Principal;
  };

  type NewActor = {
    trades : Map.Map<Text, NewTrade>;
    drills : Map.Map<Text, NewDrill>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    {
      trades = old.trades;
      drills = old.drills;
      userProfiles = old.userProfiles;
    };
  };
};
