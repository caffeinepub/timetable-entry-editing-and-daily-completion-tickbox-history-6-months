import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Update all "Sigma Student 🗿" direct mentions to "Topper Student🏆".
// Use migration on upgrade to clear all invalid/old rank values from persistent state.

(with migration = Migration.run)
actor {
  let initialCoins = 500;
  let appStartTime = 1662049941715;
  let backgroundUploadCost = 200;
  let maxDailyStopwatchRewards = 3;
  let streakFreezeCost = 50; // Updated cost to 100 coins

  let accessControlState = AccessControl.initState();

  public type Task = {
    id : Nat;
    title : Text;
    description : Text;
    subject : Text;
    priority : Nat;
    completed : Bool;
    createdAt : Time.Time;
    tags : [Text];
    noteId : ?Nat;
    completedAt : ?Time.Time; // Added completion timestamp
  };

  public type TimetableEntry = {
    id : Nat;
    title : Text;
    activityType : Text;
    startTime : Int;
    endTime : Int;
    colorCode : Text;
    createdAt : Time.Time;
  };

  public type Note = {
    id : Nat;
    title : Text;
    content : Text;
    subject : Text;
    createdAt : Time.Time;
    modifiedAt : Time.Time;
    imageUrls : [Storage.ExternalBlob];
    voiceNoteUrls : [Storage.ExternalBlob];
  };

  public type Reminder = {
    id : Nat;
    title : Text;
    reminderTime : Int;
    createdAt : Time.Time;
    noteId : ?Nat;
  };

  public type TimerSessionV2 = {
    sessionId : Nat;
    durationMinutes : Nat;
    completed : Bool;
    createdAt : Time.Time;
    isBackground : Bool;
    endTime : Int;
  };

  public type UserProfile = {
    name : Text;
    profileImage : ?Storage.ExternalBlob;
    bio : Text;
    coins : Nat;
    nameChangeCount : Nat;
    finishedSetup : Bool;
    dailyStudyGoal : Nat;
  };

  public type CoinReward = {
    amount : Nat;
    description : Text;
    createdAt : Time.Time;
  };

  public type UseCount = {
    time : Int;
    useSum : Nat;
  };

  public type FocusSession = {
    sessionId : Nat;
    startTime : Int;
    durationMinutes : Nat;
    completed : Bool;
  };

  public type PersistentFocusTimer = {
    remainingMinutes : Nat;
    isActive : Bool;
  };

  public type PersistentStopwatch = {
    startTime : Time.Time;
    isRunning : Bool;
    accumulatedTime : Nat; // Use compatible Nat type for stability
  };

  public type TimetableTick = {
    entryId : Nat;
    timestamp : Int;
  };

  public type DailySummary = {
    time : Time.Time;
    useSum : Nat;
    rewardSum : Nat;
    rewardCount : Nat;
  };

  public type StreakRecord = {
    lastActivity : Time.Time;
    streak : Nat;
  };

  public type LevelStage = {
    level : Nat;
    rank : Text;
    displayText : Text;
    requiredCoins : Nat;
  };

  public type ShopItem = {
    id : Text;
    name : Text;
    description : Text;
    image : Storage.ExternalBlob;
    price : Nat;
    coinsReward : Nat;
    isBackground : Bool;
  };

  public type PurchaseResult = {
    success : Bool;
    message : Text;
    itemId : ?Text;
    itemName : ?Text;
  };

  // Keep ranks persistent to ensure backward compatibility in case of direct value persistence
  var levelRanks : [Text] = [
    "Noob",
    "Beginner 📈",
    "Advanced Student 💪🏻",
    "Pro Student 🔥",
    "Topper Student🏆",
  ];

  // Persistent user data structures
  let userTasks = Map.empty<Principal, Map.Map<Nat, Task>>();
  let userTimetableEntries = Map.empty<Principal, Map.Map<Nat, TimetableEntry>>();
  let userReminders = Map.empty<Principal, Map.Map<Nat, Reminder>>();
  let userTimerSessions = Map.empty<Principal, Map.Map<Nat, TimerSessionV2>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userCoinRewards = Map.empty<Principal, Map.Map<Nat, CoinReward>>();
  let userUseCounts = Map.empty<Principal, Map.Map<Nat, UseCount>>();
  let userFocusSessions = Map.empty<Principal, Map.Map<Nat, FocusSession>>();
  let persistentFocusTimers = Map.empty<Principal, PersistentFocusTimer>();
  let persistentStopwatches = Map.empty<Principal, PersistentStopwatch>();

  let userNotes = Map.empty<Principal, Map.Map<Nat, Note>>();

  let dailySummaries = Map.empty<Principal, Map.Map<Time.Time, DailySummary>>();
  let streakRecords = Map.empty<Principal, StreakRecord>();

  let ownedBackgrounds = Map.empty<Principal, Map.Map<Text, Bool>>();

  var nextTickId = 0;
  let timetableTicks = Map.empty<Nat, TimetableTick>();
  let timetableTickOwners = Map.empty<Nat, Principal>();

  var nextNoteId = 1;

  // User Level state - persists across upgrades
  let userLevels = Map.empty<Principal, LevelStage>();

  let defaultLevelStage : LevelStage = {
    level = 1;
    rank = "Noob";
    displayText = "Level 1 - Noob";
    requiredCoins = 0;
  };

  // Streak Freeze - persistent map
  let userStreakFreezes = Map.empty<Principal, Nat>();

  // Streak Milestone Reward Tracking
  public type StreakMilestoneRewards = {
    has30DayBronzeBadge : Bool;
    has60DaySilverBadge : Bool;
    has100DayGoldBadge : Bool;
    has150DayDiamondBadge : Bool;
    has210DayPlatinumBadge : Bool;
    has365DayScholarBadge : Bool;
  };

  let userStreakMilestoneRewards = Map.empty<Principal, StreakMilestoneRewards>();

  // Streak Badge Tier
  public type StreakBadgeTier = {
    #none;
    #bronze;
    #silver;
    #gold;
    #diamond;
    #platinum;
    #scholar;
  };

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  func getUserTaskMap(user : Principal) : Map.Map<Nat, Task> {
    switch (userTasks.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, Task>();
        userTasks.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserTimetableMap(user : Principal) : Map.Map<Nat, TimetableEntry> {
    switch (userTimetableEntries.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, TimetableEntry>();
        userTimetableEntries.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserRemindersMap(user : Principal) : Map.Map<Nat, Reminder> {
    switch (userReminders.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, Reminder>();
        userReminders.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserTimerSessionsMap(user : Principal) : Map.Map<Nat, TimerSessionV2> {
    switch (userTimerSessions.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, TimerSessionV2>();
        userTimerSessions.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserCoinRewardsMap(user : Principal) : Map.Map<Nat, CoinReward> {
    switch (userCoinRewards.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, CoinReward>();
        userCoinRewards.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserUseCountsMap(user : Principal) : Map.Map<Nat, UseCount> {
    switch (userUseCounts.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, UseCount>();
        userUseCounts.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserFocusSessionsMap(user : Principal) : Map.Map<Nat, FocusSession> {
    switch (userFocusSessions.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, FocusSession>();
        userFocusSessions.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getUserNotesMap(user : Principal) : Map.Map<Nat, Note> {
    switch (userNotes.get(user)) {
      case (null) {
        let newMap = Map.empty<Nat, Note>();
        userNotes.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getOwnedBackgroundsMap(user : Principal) : Map.Map<Text, Bool> {
    switch (ownedBackgrounds.get(user)) {
      case (null) {
        let newMap = Map.empty<Text, Bool>();
        ownedBackgrounds.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getDailySummariesMap(user : Principal) : Map.Map<Time.Time, DailySummary> {
    switch (dailySummaries.get(user)) {
      case (null) {
        let newMap = Map.empty<Time.Time, DailySummary>();
        dailySummaries.add(user, newMap);
        newMap;
      };
      case (?map) { map };
    };
  };

  func getDayStart(timestamp : Time.Time) : Time.Time {
    let nanosPerDay : Int = 24 * 3600 * 1_000_000_000;
    (timestamp / nanosPerDay) * nanosPerDay;
  };

  func getTodayRewardCount(user : Principal) : Nat {
    let summaries = getDailySummariesMap(user);
    let today = getDayStart(Time.now());
    switch (summaries.get(today)) {
      case (null) { 0 };
      case (?summary) { summary.rewardCount };
    };
  };

  func updateDailySummary(user : Principal, rewardAmount : Nat, studyMinutes : Nat) {
    let summaries = getDailySummariesMap(user);
    let today = getDayStart(Time.now());

    let updated = switch (summaries.get(today)) {
      case (null) {
        {
          time = today;
          useSum = studyMinutes;
          rewardSum = rewardAmount;
          rewardCount = if (rewardAmount > 0) { 1 } else { 0 };
        };
      };
      case (?existing) {
        {
          time = today;
          useSum = existing.useSum + studyMinutes;
          rewardSum = existing.rewardSum + rewardAmount;
          rewardCount = existing.rewardCount + (if (rewardAmount > 0) { 1 } else { 0 });
        };
      };
    };

    summaries.add(today, updated);
  };

  func verifyTimetableEntryOwnership(caller : Principal, entryId : Nat) : Bool {
    let entries = getUserTimetableMap(caller);
    switch (entries.get(entryId)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func getRankIndex(index : Nat) : Nat {
    if (index < levelRanks.size()) {
      index;
    } else {
      0;
    };
  };

  func createLevelStage(level : Nat, rank : Text, requiredCoins : Nat) : LevelStage {
    {
      level;
      rank;
      displayText = "Level " # level.toText() # " - " # rank;
      requiredCoins;
    };
  };

  func createRank(level : Nat, rankIndex : Nat) : LevelStage {
    let requiredCoins = if (level == 1) {
      50;
    } else {
      level * 50;
    };
    createLevelStage(level, levelRanks[getRankIndex(rankIndex)], requiredCoins);
  };

  func getNextStage(currentStage : LevelStage) : LevelStage {
    let rankIndex = levelRanks.findIndex(func(rank) { rank == currentStage.rank });
    let currentRankIndex = switch (rankIndex) {
      case (null) { 0 };
      case (?index) { index };
    };

    if (currentRankIndex >= 4) {
      createRank(currentStage.level + 1, 0);
    } else {
      createRank(currentStage.level, currentRankIndex + 1);
    };
  };

  func getUserCoins(user : Principal) : Nat {
    switch (userProfiles.get(user)) {
      case (null) { 0 };
      case (?profile) { profile.coins };
    };
  };

  func setUserCoins(user : Principal, coins : Nat) {
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = { profile with coins };
        userProfiles.add(user, updatedProfile);
      };
    };
  };
};

