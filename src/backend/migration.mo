// This migration is need to persist the trades and userProfiles for canister upgrades
import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type Trade = {
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

  type UserProfile = {
    name : Text;
  };

  // Old actor
  type OldActor = {
    trades : Map.Map<Text, Trade>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // New actor (same content)
  type NewActor = {
    trades : Map.Map<Text, Trade>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // Map any existing persistent storage to new actor (still empty in original code)
  public func run(old : OldActor) : NewActor {
    old;
  };
};
