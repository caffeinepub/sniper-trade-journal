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
      { id = "seed_1"; institution = "Goldman Sachs"; headline = "Goldman Sachs raises USD target as Fed signals prolonged restrictive policy"; summary = "Goldman Sachs revised their 12-month USD target upward after the Federal Reserve indicated rates will remain elevated longer than previously anticipated. Analysts cite resilient labor markets and sticky core inflation as key drivers keeping the dollar strong into mid-2026."; currency = "USD"; sentiment = "Bullish"; date = "2026-03-13"; createdAt = 1741564800000000000 },
      { id = "seed_2"; institution = "JPMorgan Chase"; headline = "JPMorgan cuts EUR forecast, ECB rate path divergence widens"; summary = "JPMorgan lowered their EUR/USD year-end forecast to 1.04 as the ECB accelerates its easing cycle while the Fed holds firm. The growing rate differential is creating sustained selling pressure on the euro across all major pairs."; currency = "EUR"; sentiment = "Bearish"; date = "2026-03-13"; createdAt = 1741564700000000000 },
      { id = "seed_3"; institution = "Morgan Stanley"; headline = "Morgan Stanley: GBP at critical juncture ahead of BOE decision"; summary = "Morgan Stanley issued a cautious GBP note ahead of the upcoming Bank of England rate decision, warning that any dovish surprise could push cable below 1.2500. UK inflation is cooling faster than expected, raising the probability of a cut at the next meeting."; currency = "GBP"; sentiment = "Bearish"; date = "2026-03-12"; createdAt = 1741478400000000000 },
      { id = "seed_4"; institution = "Federal Reserve"; headline = "Federal Reserve minutes: No rate cuts until inflation returns to 2% target"; summary = "Minutes from the latest FOMC meeting confirm that policymakers are in no rush to cut rates, with most members wanting additional evidence that inflation is durably declining. The hawkish tone supports the USD and pressures emerging market currencies."; currency = "USD"; sentiment = "Bullish"; date = "2026-03-12"; createdAt = 1741478300000000000 },
      { id = "seed_5"; institution = "European Central Bank"; headline = "ECB signals April cut is on the table as euro zone inflation falls to 2.1%"; summary = "ECB President Christine Lagarde confirmed that an April rate cut is being actively discussed after euro area inflation dropped to 2.1% in February 2026, the closest to target since 2021. Markets have repriced to a 90% probability of a 25bps cut next month."; currency = "EUR"; sentiment = "Bearish"; date = "2026-03-11"; createdAt = 1741392000000000000 },
      { id = "seed_6"; institution = "Citigroup"; headline = "Citigroup: JPY positioning extreme, BoJ intervention risk rising sharply"; summary = "Citigroup FX strategists flagged that speculative short JPY positioning is at multi-year extremes. With USD/JPY trading above 152, the risk of Bank of Japan verbal or physical intervention is the highest since 2024. They recommend cutting short JPY exposure significantly."; currency = "JPY"; sentiment = "Bullish"; date = "2026-03-11"; createdAt = 1741391900000000000 },
      { id = "seed_7"; institution = "Bank of America"; headline = "Bank of America upgrades Gold to Overweight on geopolitical risk premium"; summary = "Bank of America raised their Gold price target to $3,200/oz and upgraded the metal to Overweight, citing elevated geopolitical uncertainty in the Middle East, continued central bank buying, and expectations of eventual Fed easing supporting the precious metal."; currency = "Gold"; sentiment = "Bullish"; date = "2026-03-10"; createdAt = 1741305600000000000 },
      { id = "seed_8"; institution = "Goldman Sachs"; headline = "Goldman Sachs sees Bitcoin consolidating near $90K before next leg higher"; summary = "Goldman Sachs digital asset team published a note arguing that Bitcoin is in a healthy consolidation phase after its parabolic Q4 2025 rally. Institutional inflows through ETFs remain robust and the team maintains a $120K year-end 2026 price target."; currency = "Bitcoin"; sentiment = "Bullish"; date = "2026-03-10"; createdAt = 1741305500000000000 },
      { id = "seed_9"; institution = "JPMorgan Chase"; headline = "JPMorgan: Oil market tighter than expected, Brent to reach $95 by Q2 2026"; summary = "JPMorgan commodity analysts revised their Brent crude forecast upward to $95/barrel for Q2 2026, citing OPEC+ supply discipline, stronger-than-expected global demand, and disruption risks in key producer regions. The upgrade also supports commodity-linked currencies like CAD and NOK."; currency = "Oil"; sentiment = "Bullish"; date = "2026-03-09"; createdAt = 1741219200000000000 },
      { id = "seed_10"; institution = "Bank of England"; headline = "Bank of England holds rates but opens door to May cut"; summary = "The Bank of England voted 6-3 to keep rates at 5.0% but the split decision and accompanying statement indicated a majority are prepared to cut in May if wage growth continues to moderate. GBP sold off immediately following the announcement."; currency = "GBP"; sentiment = "Bearish"; date = "2026-03-09"; createdAt = 1741219100000000000 },
      { id = "seed_11"; institution = "Bank of Japan"; headline = "Bank of Japan signals next hike could come as early as June 2026"; summary = "BoJ Governor Ueda stated that the central bank is on track to normalize monetary policy and hinted at a possible rate hike at the June meeting if wage negotiations confirm a sustained rise in real wages. USD/JPY dropped 200 pips on the headline."; currency = "JPY"; sentiment = "Bullish"; date = "2026-03-08"; createdAt = 1741132800000000000 },
      { id = "seed_12"; institution = "International Monetary Fund"; headline = "IMF warns of fragmented global trade risks, downgrades 2026 growth outlook"; summary = "The IMF cut its 2026 global GDP growth forecast by 0.3 percentage points to 3.0%, citing rising trade fragmentation, sticky inflation in advanced economies, and tighter financial conditions. The report highlights particular vulnerability in export-dependent economies and emerging markets."; currency = "USD"; sentiment = "Neutral"; date = "2026-03-08"; createdAt = 1741132700000000000 },
      { id = "seed_13"; institution = "Morgan Stanley"; headline = "Morgan Stanley turns bullish on Ethereum ahead of major protocol upgrade"; summary = "Morgan Stanley digital assets research initiated a positive outlook on Ethereum following the announcement of a major protocol efficiency upgrade due in Q2 2026. The upgrade is expected to reduce transaction costs by 40% and attract significant new DeFi activity, with a price target of $4,500."; currency = "Ethereum"; sentiment = "Bullish"; date = "2026-03-07"; createdAt = 1741046400000000000 },
      { id = "seed_14"; institution = "World Bank"; headline = "World Bank raises emerging market growth forecasts on commodity tailwinds"; summary = "The World Bank upgraded growth projections for commodity-exporting emerging markets after sustained high commodity prices boosted export revenues. Countries like Brazil, South Africa, and Indonesia are expected to outperform, with positive spillovers for their respective currencies."; currency = "Gold"; sentiment = "Bullish"; date = "2026-03-07"; createdAt = 1741046300000000000 },
      { id = "seed_15"; institution = "Citigroup"; headline = "Citigroup: EUR/USD to test 1.02 parity if ECB cuts twice before June"; summary = "Citi FX desk published a bearish EUR scenario analysis showing EUR/USD could retest parity levels if the ECB delivers two rate cuts before June 2026 while the Fed remains on hold. They recommend adding EUR/USD shorts on any bounce toward 1.0700."; currency = "EUR"; sentiment = "Bearish"; date = "2026-03-06"; createdAt = 1740960000000000000 },
      { id = "seed_16"; institution = "Bank of America"; headline = "Bank of America: USD/JPY breakout above 155 would accelerate yen depreciation"; summary = "Bank of America technical and macro teams jointly published a note warning that a confirmed break above 155 in USD/JPY could trigger accelerated yen selling as stop losses cluster between 155 and 157. They expect the BoJ to verbally intervene first before committing FX reserves."; currency = "JPY"; sentiment = "Bearish"; date = "2026-03-06"; createdAt = 1740959900000000000 }
    ];

    for (item in seedItems.values()) {
      institutionalNews.add(item.id, item);
    };
  };

  // Trigger seeding
  seedInstitutionalNews();

  public query func getInstitutionalNews() : async [InstitutionalNews] {
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

  public query func getInstitutionalSentimentSummary() : async [SentimentSummary] {
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
