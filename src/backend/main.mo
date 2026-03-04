import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Set "mo:core/Set";
import Int "mo:core/Int";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";


actor {
  include MixinStorage();

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  type TradeInput = {
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
  };

  type Analytics = {
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

  public type UserProfile = {
    name : Text;
  };

  let trades = Map.empty<Text, Trade>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Trade Functions
  func generateUUID(caller : Principal, timestamp : Int) : Text {
    let ts = Int.abs(timestamp);
    caller.toText() # "_" # ts.toText();
  };

  public shared ({ caller }) func createTrade(input : TradeInput) : async Trade {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trades");
    };

    let ts = Time.now();
    let uuid = generateUUID(caller, ts);
    let trade : Trade = {
      id = uuid;
      owner = caller;
      date = input.date;
      symbol = input.symbol;
      session = input.session;
      timeframe = input.timeframe;
      direction = input.direction;
      biasBeforeEntry = input.biasBeforeEntry;
      setupType = input.setupType;
      entryReason = input.entryReason;
      entryPrice = input.entryPrice;
      stopLoss = input.stopLoss;
      takeProfit = input.takeProfit;
      riskPercent = input.riskPercent;
      rrRatio = input.rrRatio;
      rMultiple = input.rMultiple;
      pnlPercent = input.pnlPercent;
      result = input.result;
      psychBefore = input.psychBefore;
      psychDuring = input.psychDuring;
      psychAfter = input.psychAfter;
      followedRules = input.followedRules;
      exitedEarly = input.exitedEarly;
      movedStopLoss = input.movedStopLoss;
      setupGrade = input.setupGrade;
      mainLesson = input.mainLesson;
      tags = input.tags;
      screenshot = input.screenshot;
      createdAt = ts;
      updatedAt = ts;
    };
    trades.add(uuid, trade);
    trade;
  };

  public shared ({ caller }) func updateTrade(id : Text, input : TradeInput) : async ?Trade {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trades");
    };

    switch (trades.get(id)) {
      case (null) { null };
      case (?existingTrade) {
        if (not Principal.equal(caller, existingTrade.owner)) {
          Runtime.trap("Unauthorized: Can only update your own trades");
        };

        let updatedTrade : Trade = {
          existingTrade with
          date = input.date;
          symbol = input.symbol;
          session = input.session;
          timeframe = input.timeframe;
          direction = input.direction;
          biasBeforeEntry = input.biasBeforeEntry;
          setupType = input.setupType;
          entryReason = input.entryReason;
          entryPrice = input.entryPrice;
          stopLoss = input.stopLoss;
          takeProfit = input.takeProfit;
          riskPercent = input.riskPercent;
          rrRatio = input.rrRatio;
          rMultiple = input.rMultiple;
          pnlPercent = input.pnlPercent;
          result = input.result;
          psychBefore = input.psychBefore;
          psychDuring = input.psychDuring;
          psychAfter = input.psychAfter;
          followedRules = input.followedRules;
          exitedEarly = input.exitedEarly;
          movedStopLoss = input.movedStopLoss;
          setupGrade = input.setupGrade;
          mainLesson = input.mainLesson;
          tags = input.tags;
          screenshot = input.screenshot;
          updatedAt = Time.now();
        };
        trades.add(id, updatedTrade);
        ?updatedTrade;
      };
    };
  };

  public shared ({ caller }) func deleteTrade(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trades");
    };

    switch (trades.get(id)) {
      case (null) { false };
      case (?trade) {
        if (not Principal.equal(trade.owner, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own trades");
        };
        trades.remove(id);
        true;
      };
    };
  };

  public query ({ caller }) func getTrades() : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };

    trades.values().toArray().filter(
      func(t) {
        Principal.equal(caller, t.owner);
      }
    );
  };

  public query ({ caller }) func getTradeById(id : Text) : async ?Trade {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };

    switch (trades.get(id)) {
      case (null) { null };
      case (?trade) {
        // Only return the trade if the caller is the owner or an admin
        if (Principal.equal(caller, trade.owner) or AccessControl.isAdmin(accessControlState, caller)) {
          ?trade;
        } else {
          Runtime.trap("Unauthorized: Can only view your own trades");
        };
      };
    };
  };

  public query ({ caller }) func getUniqueTags() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tags");
    };

    let userTags = trades.values().toArray().flatMap(
      func(t) {
        if (Principal.equal(t.owner, caller)) {
          t.tags.values();
        } else {
          [].values();
        };
      }
    );

    let tagSet = Set.empty<Text>();
    userTags.forEach(func(tag) { tagSet.add(tag) });
    tagSet.values().toArray();
  };

  public query ({ caller }) func getAnalytics() : async Analytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view analytics");
    };

    let tradesArray = trades.values().toArray().filter(
      func(t) { Principal.equal(t.owner, caller) }
    );
    let total = tradesArray.size();

    if (total == 0) {
      return {
        totalTrades = 0;
        wins = 0;
        losses = 0;
        breakEvens = 0;
        winRate = 0.0;
        avgRR = 0.0;
        avgRMultiple = 0.0;
        totalNetR = 0.0;
        profitFactor = 0.0;
        expectancy = 0.0;
        followedRulesPercent = 0.0;
        exitedEarlyPercent = 0.0;
        movedStopLossPercent = 0.0;
      };
    };

    var wins = 0;
    var losses = 0;
    var breakEvens = 0;
    var totalRR = 0.0;
    var totalRMultiple = 0.0;
    var totalNetR = 0.0;
    var ruled = 0;
    var exitedEarly = 0;
    var movedStop = 0;

    for (trade in tradesArray.values()) {
      switch (trade.result) {
        case ("Win") {
          wins += 1;
        };
        case ("Loss") {
          losses += 1;
        };
        case ("BreakEven") {
          breakEvens += 1;
        };
        case (_) {};
      };

      totalRR += trade.rrRatio;
      totalRMultiple += trade.rMultiple;
      totalNetR += trade.rMultiple;

      if (trade.followedRules) { ruled += 1 };
      if (trade.exitedEarly) { exitedEarly += 1 };
      if (trade.movedStopLoss) { movedStop += 1 };
    };

    let winRate = if (total == 0) { 0.0 } else {
      (100.0 * Int.abs(wins - losses).toFloat()) / total.toFloat();
    };

    let avgRR = if (total == 0) { 0.0 } else {
      totalRR / total.toFloat();
    };

    let avgRMultiple = if (total == 0) { 0.0 } else {
      totalRMultiple / total.toFloat();
    };

    let followedRulesPercent = (ruled.toFloat() / total.toFloat()) * 100.0;
    let exitedEarlyPercent = (exitedEarly.toFloat() / total.toFloat()) * 100.0;
    let movedStopLossPercent = (movedStop.toFloat() / total.toFloat()) * 100.0;

    {
      totalTrades = total;
      wins;
      losses;
      breakEvens;
      winRate;
      avgRR;
      avgRMultiple;
      totalNetR;
      profitFactor = 0.0;
      expectancy = 0.0;
      followedRulesPercent;
      exitedEarlyPercent;
      movedStopLossPercent;
    };
  };
};
