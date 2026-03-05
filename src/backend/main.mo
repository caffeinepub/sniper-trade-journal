import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  // Access Control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
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

  type Drill = {
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

  type DrillInput = {
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

  // Persistent storage MUST use stable let
  stable let trades = Map.empty<Text, Trade>();
  stable let drills = Map.empty<Text, Drill>();
  stable let userProfiles = Map.empty<Principal, UserProfile>();

  // New Admin Stats Types
  public type UserStats = {
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

  public type PlatformStats = {
    totalUsersWithTrades : Nat;
    totalTrades : Nat;
    avgWinRate : Float;
    mostActiveTrader : Principal;
  };

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

  // UUID Generation
  func generateUUID(caller : Principal, timestamp : Int) : Text {
    let ts = Int.abs(timestamp);
    caller.toText() # "_" # ts.toText();
  };

  // Trade Functions
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
    switch (trades.get(id)) {
      case (null) { null };
      case (?trade) {
        if (Principal.equal(caller, trade.owner) or AccessControl.isAdmin(accessControlState, caller)) {
          ?trade;
        } else {
          Runtime.trap("Unauthorized: Cannot view this trade");
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
    var totalWinRMultiple = 0.0;
    var totalLossRMultiple = 0.0;
    var winCountWinR = 0;
    var lossCountLossR = 0;

    for (trade in tradesArray.values()) {
      switch (trade.result) {
        case ("Win") {
          wins += 1;
          totalWinRMultiple += trade.rMultiple;
          winCountWinR += 1;
        };
        case ("Loss") {
          losses += 1;
          totalLossRMultiple += trade.rMultiple;
          lossCountLossR += 1;
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
      ((wins.toFloat() / total.toFloat()) * 100.0);
    };

    let avgRR = if (total == 0) { 0.0 } else {
      totalRR / total.toFloat();
    };

    let avgRMultiple = if (total == 0) { 0.0 } else {
      totalRMultiple / total.toFloat();
    };

    let avgWinR = if (winCountWinR > 0) {
      totalWinRMultiple / winCountWinR.toFloat();
    } else { 0.0 };

    let avgLossR = if (lossCountLossR > 0) {
      Int.abs(totalLossRMultiple.toInt()).toFloat() / lossCountLossR.toFloat();
    } else { 0.0 };

    let followedRulesPercent = (ruled.toFloat() / total.toFloat()) * 100.0;
    let exitedEarlyPercent = (exitedEarly.toFloat() / total.toFloat()) * 100.0;
    let movedStopLossPercent = (movedStop.toFloat() / total.toFloat()) * 100.0;

    let profitFactor = if (totalLossRMultiple == 0.0) {
      if (totalWinRMultiple != 0.0) { 99.99 } else { 0.0 };
    } else {
      totalWinRMultiple / Int.abs(totalLossRMultiple.toInt()).toFloat();
    };

    let expectancy = (winRate / 100.0 * avgWinR) - ((1.0 - winRate / 100.0) * avgLossR);

    {
      totalTrades = total;
      wins;
      losses;
      breakEvens;
      winRate;
      avgRR;
      avgRMultiple;
      totalNetR;
      profitFactor;
      expectancy;
      followedRulesPercent;
      exitedEarlyPercent;
      movedStopLossPercent;
    };
  };

  // Drill Functions
  public shared ({ caller }) func createDrill(input : DrillInput) : async Drill {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create drills");
    };

    let ts = Time.now();
    let uuid = generateUUID(caller, ts);
    let drill : Drill = {
      id = uuid;
      owner = caller;
      date = input.date;
      symbol = input.symbol;
      timeframe = input.timeframe;
      drillType = input.drillType;
      structureNotes = input.structureNotes;
      liquidityObservations = input.liquidityObservations;
      induceNotes = input.induceNotes;
      marketShiftObservations = input.marketShiftObservations;
      entryAnalysis = input.entryAnalysis;
      screenshot = input.screenshot;
      createdAt = ts;
      updatedAt = ts;
    };
    drills.add(uuid, drill);
    drill;
  };

  public shared ({ caller }) func updateDrill(id : Text, input : DrillInput) : async ?Drill {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update drills");
    };

    switch (drills.get(id)) {
      case (null) { null };
      case (?existingDrill) {
        if (not Principal.equal(caller, existingDrill.owner)) {
          Runtime.trap("Unauthorized: Can only update your own drills");
        };

        let updatedDrill : Drill = {
          existingDrill with
          date = input.date;
          symbol = input.symbol;
          timeframe = input.timeframe;
          drillType = input.drillType;
          structureNotes = input.structureNotes;
          liquidityObservations = input.liquidityObservations;
          induceNotes = input.induceNotes;
          marketShiftObservations = input.marketShiftObservations;
          entryAnalysis = input.entryAnalysis;
          screenshot = input.screenshot;
          updatedAt = Time.now();
        };
        drills.add(id, updatedDrill);
        ?updatedDrill;
      };
    };
  };

  public shared ({ caller }) func deleteDrill(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete drills");
    };

    switch (drills.get(id)) {
      case (null) { false };
      case (?drill) {
        if (not Principal.equal(drill.owner, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own drills");
        };
        drills.remove(id);
        true;
      };
    };
  };

  public query ({ caller }) func getDrills() : async [Drill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view drills");
    };

    drills.values().toArray().filter(
      func(d) {
        Principal.equal(caller, d.owner);
      }
    );
  };

  public query ({ caller }) func getDrillById(id : Text) : async ?Drill {
    switch (drills.get(id)) {
      case (null) { null };
      case (?drill) {
        if (Principal.equal(caller, drill.owner) or AccessControl.isAdmin(accessControlState, caller)) {
          ?drill;
        } else {
          Runtime.trap("Unauthorized: Cannot view this drill");
        };
      };
    };
  };

  // ADMIN ONLY functions
  public query ({ caller }) func adminGetPlatformStats() : async PlatformStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access platform stats");
    };

    let tradesArray = trades.values().toArray();
    let uniqueOwners = Set.empty<Principal>();

    // Build map of owner -> trade count
    let ownerTradeCount = Map.empty<Principal, Nat>();
    for (trade in tradesArray.values()) {
      uniqueOwners.add(trade.owner);
      let currentCount = switch (ownerTradeCount.get(trade.owner)) {
        case (null) { 0 };
        case (?count) { count };
      };
      ownerTradeCount.add(trade.owner, currentCount + 1);
    };

    // Find most active trader
    var mostActiveTrader = Principal.fromText("aaaaa-aa");
    var mostTrades = 0;
    for ((owner, count) in ownerTradeCount.entries()) {
      if (count > mostTrades) {
        mostTrades := count;
        mostActiveTrader := owner;
      };
    };

    // Calculate average win rate across all users
    var totalWinRate = 0.0;
    var userCount = 0;
    for (owner in uniqueOwners.values()) {
      let userTrades = tradesArray.filter(
        func(t) { Principal.equal(t.owner, owner) }
      );
      if (userTrades.size() > 0) {
        let analytics = calculateAnalytics(userTrades, userTrades.size());
        totalWinRate += analytics.winRate;
        userCount += 1;
      };
    };

    {
      totalUsersWithTrades = uniqueOwners.size();
      totalTrades = tradesArray.size();
      avgWinRate = if (userCount == 0) { 0.0 } else {
        totalWinRate / userCount.toFloat();
      };
      mostActiveTrader;
    };
  };

  public query ({ caller }) func adminGetAllUsers() : async [UserStats] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access all users");
    };

    let tradesArray = trades.values().toArray();
    let uniqueOwners = Set.empty<Principal>();

    // Collect unique owners
    for (trade in tradesArray.values()) {
      uniqueOwners.add(trade.owner);
    };

    // Build stats for each unique owner
    let userStatsArray = uniqueOwners.values().toArray().flatMap(
      func(owner) {
        let ownerTrades = tradesArray.filter(
          func(t) { Principal.equal(t.owner, owner) }
        );

        if (ownerTrades.size() > 0) {
          switch (calculateUserStats(ownerTrades, ownerTrades.size(), owner)) {
            case (?stats) { [stats].values() };
            case (null) { [].values() };
          };
        } else {
          [].values();
        };
      }
    );

    userStatsArray;
  };

  public query ({ caller }) func adminGetUserTrades(user : Principal) : async [Trade] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access user trades");
    };

    trades.values().toArray().filter(
      func(t) { Principal.equal(t.owner, user) }
    );
  };

  public query ({ caller }) func adminGetUserStats(user : Principal) : async Analytics {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access user stats");
    };

    let tradesArray = trades.values().toArray().filter(
      func(t) { Principal.equal(t.owner, user) }
    );

    calculateAnalytics(tradesArray, tradesArray.size());
  };

  // Helper Functions
  func calculateAnalytics(trades : [Trade], total : Nat) : Analytics {
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
    var totalWinRMultiple = 0.0;
    var totalLossRMultiple = 0.0;
    var winCountWinR = 0;
    var lossCountLossR = 0;

    for (trade in trades.values()) {
      switch (trade.result) {
        case ("Win") {
          wins += 1;
          totalWinRMultiple += trade.rMultiple;
          winCountWinR += 1;
        };
        case ("Loss") {
          losses += 1;
          totalLossRMultiple += trade.rMultiple;
          lossCountLossR += 1;
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
      ((wins.toFloat() / total.toFloat()) * 100.0);
    };

    let avgRR = if (total == 0) { 0.0 } else {
      totalRR / total.toFloat();
    };

    let avgRMultiple = if (total == 0) { 0.0 } else {
      totalRMultiple / total.toFloat();
    };

    let avgWinR = if (winCountWinR > 0) {
      totalWinRMultiple / winCountWinR.toFloat();
    } else { 0.0 };

    let avgLossR = if (lossCountLossR > 0) {
      Int.abs(totalLossRMultiple.toInt()).toFloat() / lossCountLossR.toFloat();
    } else { 0.0 };

    let followedRulesPercent = (ruled.toFloat() / total.toFloat()) * 100.0;
    let exitedEarlyPercent = (exitedEarly.toFloat() / total.toFloat()) * 100.0;
    let movedStopLossPercent = (movedStop.toFloat() / total.toFloat()) * 100.0;

    let profitFactor = if (totalLossRMultiple == 0.0) {
      if (totalWinRMultiple != 0.0) { 99.99 } else { 0.0 };
    } else {
      totalWinRMultiple / Int.abs(totalLossRMultiple.toInt()).toFloat();
    };

    let expectancy = (winRate / 100.0 * avgWinR) - ((1.0 - winRate / 100.0) * avgLossR);

    {
      totalTrades = total;
      wins;
      losses;
      breakEvens;
      winRate;
      avgRR;
      avgRMultiple;
      totalNetR;
      profitFactor;
      expectancy;
      followedRulesPercent;
      exitedEarlyPercent;
      movedStopLossPercent;
    };
  };

  func calculateUserStats(trades : [Trade], total : Nat, owner : Principal) : ?UserStats {
    if (total == 0) { return null };

    var wins = 0;
    var losses = 0;
    var totalRR = 0.0;
    var totalRMultiple = 0.0;
    var totalNetR = 0.0;
    var mostRecentTradeDate = "";

    for (trade in trades.values()) {
      switch (trade.result) {
        case ("Win") { wins += 1 };
        case ("Loss") { losses += 1 };
        case (_) {};
      };

      totalRR += trade.rrRatio;
      totalRMultiple += trade.rMultiple;
      totalNetR += trade.rMultiple;

      if (trade.date != "") {
        if (mostRecentTradeDate == "" or trade.date > mostRecentTradeDate) {
          mostRecentTradeDate := trade.date;
        };
      };
    };

    let winRate = if (total == 0) { 0.0 } else {
      ((wins.toFloat() / total.toFloat()) * 100.0);
    };

    let avgRR = if (total == 0) { 0.0 } else {
      totalRR / total.toFloat();
    };

    let avgRMultiple = if (total == 0) { 0.0 } else {
      totalRMultiple / total.toFloat();
    };

    ?{
      owner;
      totalTrades = total;
      wins;
      losses;
      winRate;
      avgRR;
      avgRMultiple;
      totalNetR;
      mostRecentTradeDate;
    };
  };
};
