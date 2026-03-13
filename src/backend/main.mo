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
import List "mo:core/List";
import Array "mo:core/Array";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";


actor {
  include MixinStorage();

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
    pnlDollar : Float;
    accountBalance : Float;
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
    pnlDollar : Float;
    accountBalance : Float;
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

  public type InstitutionalNews = {
    id : Text;
    institution : Text;
    headline : Text;
    summary : Text;
    currency : Text;
    sentiment : Text;
    date : Text;
    createdAt : Int;
  };

  public type InstitutionalNewsInput = {
    institution : Text;
    headline : Text;
    summary : Text;
    currency : Text;
    sentiment : Text;
    date : Text;
  };

  public type SentimentSummary = {
    currency : Text;
    sentiment : Text;
    count : Nat;
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
  let drills = Map.empty<Text, Drill>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let institutionalNews = Map.empty<Text, InstitutionalNews>();

  // Seed data counter to avoid re-seeding
  var newsSeeded : Bool = false;

  func seedInstitutionalNews() {
    if (newsSeeded) { return };
    newsSeeded := true;

    let seedItems : [InstitutionalNews] = [
      { id = "seed_1"; institution = "Goldman Sachs"; headline = "USD expected to strengthen in Q3 2025"; summary = "Goldman Sachs analysts forecast robust US economic data, elevated Fed rates, and strong consumer spending will continue to support the dollar against major peers."; currency = "USD"; sentiment = "Bullish"; date = "2025-03-10"; createdAt = 1741564800000000000 },
      { id = "seed_2"; institution = "JPMorgan Chase"; headline = "EUR under pressure as ECB signals rate cuts ahead"; summary = "JPMorgan analysts expect the euro to weaken as the ECB prepares to ease monetary policy sooner than the Fed, widening the rate differential in favor of the dollar."; currency = "EUR"; sentiment = "Bearish"; date = "2025-03-09"; createdAt = 1741478400000000000 },
      { id = "seed_3"; institution = "Morgan Stanley"; headline = "GBP resilience fading as UK growth disappoints"; summary = "Morgan Stanley downgraded their GBP outlook after weaker-than-expected UK GDP print and softening labor market data. Cable could retest 1.2400 support."; currency = "GBP"; sentiment = "Bearish"; date = "2025-03-08"; createdAt = 1741392000000000000 },
      { id = "seed_4"; institution = "Federal Reserve"; headline = "Fed holds rates, signals higher-for-longer stance"; summary = "The Federal Reserve kept rates unchanged and reiterated its commitment to bringing inflation back to 2%. Chair Powell emphasized data-dependency, reinforcing USD strength."; currency = "USD"; sentiment = "Bullish"; date = "2025-03-07"; createdAt = 1741305600000000000 },
      { id = "seed_5"; institution = "European Central Bank"; headline = "ECB prepares first rate cut, EUR outlook mixed"; summary = "The ECB signaled its first rate reduction is on the horizon if inflation continues to cool. Markets are pricing in 75bps of cuts through year-end, weighing on EUR."; currency = "EUR"; sentiment = "Neutral"; date = "2025-03-06"; createdAt = 1741219200000000000 },
      { id = "seed_6"; institution = "Citigroup"; headline = "JPY oversold, BoJ surprise hike could trigger sharp reversal"; summary = "Citigroup strategists warn that JPY is deeply oversold and a surprise Bank of Japan rate hike or hawkish language could cause a violent short-squeeze above 148."; currency = "JPY"; sentiment = "Bullish"; date = "2025-03-05"; createdAt = 1741132800000000000 },
      { id = "seed_7"; institution = "Bank of America"; headline = "AUD weakens on China demand concerns"; summary = "Bank of America cut their AUD target after disappointing Chinese PMI data raised concerns about commodity demand. Iron ore price decline pressures the Aussie dollar."; currency = "AUD"; sentiment = "Bearish"; date = "2025-03-04"; createdAt = 1741046400000000000 },
      { id = "seed_8"; institution = "Goldman Sachs"; headline = "EUR/USD range-bound near 1.08 ahead of CPI"; summary = "Goldman traders see EUR/USD consolidating between 1.0750 and 1.0900 ahead of key US CPI data. A hot print would drive a break lower while a miss could lift the pair."; currency = "EUR"; sentiment = "Neutral"; date = "2025-03-03"; createdAt = 1740960000000000000 },
      { id = "seed_9"; institution = "JPMorgan Chase"; headline = "GBP/USD positioned for recovery if UK services beat"; summary = "JPMorgan notes GBP has underperformed peers and is technically oversold. A stronger UK services PMI could trigger short-covering with a target toward 1.2700."; currency = "GBP"; sentiment = "Bullish"; date = "2025-03-02"; createdAt = 1740873600000000000 },
      { id = "seed_10"; institution = "Morgan Stanley"; headline = "USD rally may pause as DXY approaches resistance"; summary = "Morgan Stanley technical analysts flag DXY resistance at 106.50. They recommend trimming long USD positions ahead of this level as positioning is stretched."; currency = "USD"; sentiment = "Neutral"; date = "2025-03-01"; createdAt = 1740787200000000000 },
      { id = "seed_11"; institution = "Citigroup"; headline = "EUR/GBP downside limited, crosswinds ahead"; summary = "Citigroup sees EUR/GBP finding support near 0.8450 as both economies face similar headwinds. They recommend staying neutral on the cross for now."; currency = "EUR"; sentiment = "Neutral"; date = "2025-02-28"; createdAt = 1740700800000000000 },
      { id = "seed_12"; institution = "Bank of America"; headline = "JPY carry trade remains attractive despite risks"; summary = "Bank of America notes that while BoJ risk is elevated, the interest rate differential makes JPY carry trades appealing. They maintain a short JPY bias with tight stops."; currency = "JPY"; sentiment = "Bearish"; date = "2025-02-27"; createdAt = 1740614400000000000 },
      { id = "seed_13"; institution = "Federal Reserve"; headline = "Inflation data key for next Fed decision"; summary = "Fed officials emphasized that upcoming CPI and PCE data will be crucial for the timing of any rate adjustment. Persistent inflation could delay cuts further, supporting USD."; currency = "USD"; sentiment = "Bullish"; date = "2025-02-26"; createdAt = 1740528000000000000 },
      { id = "seed_14"; institution = "European Central Bank"; headline = "Euro zone growth stabilizes, EUR finds floor"; summary = "ECB board members noted improving euro zone growth indicators and stabilizing inflation. This reduces the urgency of aggressive cuts and provides mild EUR support."; currency = "EUR"; sentiment = "Neutral"; date = "2025-02-25"; createdAt = 1740441600000000000 }
    ];

    for (item in seedItems.values()) {
      institutionalNews.add(item.id, item);
    };
  };

  // Trigger seeding
  seedInstitutionalNews();

  public query ({ caller }) func getInstitutionalNews() : async [InstitutionalNews] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view institutional news");
    };
    institutionalNews.values().toArray();
  };

  public shared ({ caller }) func createInstitutionalNews(input : InstitutionalNewsInput) : async InstitutionalNews {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create institutional news");
    };
    let ts = Time.now();
    let uuid = "news_" # Int.abs(ts).toText();
    let item : InstitutionalNews = {
      id = uuid;
      institution = input.institution;
      headline = input.headline;
      summary = input.summary;
      currency = input.currency;
      sentiment = input.sentiment;
      date = input.date;
      createdAt = ts;
    };
    institutionalNews.add(uuid, item);
    item;
  };

  public shared ({ caller }) func deleteInstitutionalNews(id : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete institutional news");
    };
    switch (institutionalNews.get(id)) {
      case (null) { false };
      case (?_) {
        institutionalNews.remove(id);
        true;
      };
    };
  };

  public query ({ caller }) func getInstitutionalSentimentSummary() : async [SentimentSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sentiment summary");
    };

    let currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CHF", "NZD"];
    let newsArray = institutionalNews.values().toArray();

    let result = List.empty<SentimentSummary>();
    for (currency in currencies.values()) {
      let currencyNews = newsArray.filter(func(n) { n.currency == currency });
      let total = currencyNews.size();
      if (total > 0) {
        var bullish = 0;
        var bearish = 0;
        for (item in currencyNews.values()) {
          if (item.sentiment == "Bullish") { bullish += 1 };
          if (item.sentiment == "Bearish") { bearish += 1 };
        };
        let dominant = if (bullish > bearish) { "Bullish" } else if (bearish > bullish) { "Bearish" } else { "Neutral" };
        result.add({ currency; sentiment = dominant; count = total });
      };
    };
    result.toArray();
  };

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

  type TradeSegment = {
    segmentLabel : Text;
    winRate : Float;
    avgRR : Float;
    totalTrades : Nat;
  };

  type ExtendedAnalytics = {
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
    avgWin : Float;
    avgLoss : Float;
    sortedRMultiples : [Float];
    tradeSegments : [TradeSegment];
  };

  public query ({ caller }) func isAdminAssigned() : async Bool {
    accessControlState.adminAssigned;
  };

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
      pnlDollar = input.pnlDollar;
      accountBalance = input.accountBalance;
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
          pnlDollar = input.pnlDollar;
          accountBalance = input.accountBalance;
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

  public query ({ caller }) func getExtendedAnalytics() : async ExtendedAnalytics {
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
        avgWin = 0.0;
        avgLoss = 0.0;
        sortedRMultiples = [];
        tradeSegments = [];
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
    var totalDollarPnL = 0.0;

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
      totalDollarPnL += trade.pnlDollar;

      if (trade.followedRules) { ruled += 1 };
      if (trade.exitedEarly) { exitedEarly += 1 };
      if (trade.movedStopLoss) { movedStop += 1 };
    };

    let sortedTrades = tradesArray.sort(
      func(a, b) { if (a.createdAt < b.createdAt) { #less } else if (a.createdAt > b.createdAt) { #greater } else { #equal } }
    );
    let sortedRMultiples = sortedTrades.map(func(t) { t.rMultiple });

    let tradeSegmentsList = List.empty<TradeSegment>();
    var segmentCount = 0;

    let mutableTradesArray = tradesArray;

    while (segmentCount * 50 < mutableTradesArray.size()) {
      let segmentStart = segmentCount * 50;
      let segmentEnd = segmentStart + 50;

      let segmentTrades = mutableTradesArray.filter(
        func(_t) { true }
      ).sliceToArray(segmentStart, segmentEnd);

      let segmentSize = segmentTrades.size();
      if (segmentSize > 0) {
        var segmentWins = 0;
        var segmentTotalRR = 0.0;
        for (trade in segmentTrades.values()) {
          if (trade.result == "Win") { segmentWins += 1 };
          segmentTotalRR += trade.rrRatio;
        };

        let segmentLabel = "Trades " #
        (segmentStart + 1).toText() #
        "-" #
        (segmentStart + segmentSize).toText();

        tradeSegmentsList.add({
          segmentLabel;
          winRate = ((segmentWins.toFloat() / segmentSize.toFloat()) * 100.0);
          avgRR = if (segmentSize == 0) { 0.0 } else {
            segmentTotalRR / segmentSize.toFloat();
          };
          totalTrades = segmentSize;
        });
      };

      segmentCount += 1;
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
      avgWin = avgWinR;
      avgLoss = avgLossR;
      sortedRMultiples;
      tradeSegments = tradeSegmentsList.toArray();
    };
  };

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

  public query ({ caller }) func adminGetPlatformStats() : async PlatformStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access platform stats");
    };

    let tradesArray = trades.values().toArray();
    let uniqueOwners = Set.empty<Principal>();

    let ownerTradeCount = Map.empty<Principal, Nat>();
    for (trade in tradesArray.values()) {
      uniqueOwners.add(trade.owner);
      let currentCount = switch (ownerTradeCount.get(trade.owner)) {
        case (null) { 0 };
        case (?count) { count };
      };
      ownerTradeCount.add(trade.owner, currentCount + 1);
    };

    var mostActiveTrader = Principal.fromText("aaaaa-aa");
    var mostTrades = 0;
    for ((owner, count) in ownerTradeCount.entries()) {
      if (count > mostTrades) {
        mostTrades := count;
        mostActiveTrader := owner;
      };
    };

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

    for (trade in tradesArray.values()) {
      uniqueOwners.add(trade.owner);
    };

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
