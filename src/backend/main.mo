import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Migration "migration";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Use migration on upgrade to clear all invalid/old rank values from persistent state.
(with migration = Migration.run)
actor {
  let initialCoins = 500;
  let appStartTime = 1662049941715;
  let backgroundUploadCost = 200;
  let maxDailyStopwatchRewards = 3;
  let streakFreezeCost = 50;

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

  let levelRanks = [
    "Noob",
    "Beginner 📈",
    "Advanced Student 💪🏻",
    "Pro Student 🔥",
    "Sigma Student 🗿",
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
    has10DayReward : Bool;
    has30DayReward : Bool;
    hasScholarGoldBadge : Bool;
  };

  let userStreakMilestoneRewards = Map.empty<Principal, StreakMilestoneRewards>();

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

  public shared ({ caller }) func addTimetableEntry(title : Text, activityType : Text, startTime : Int, endTime : Int, colorCode : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add timetable entries");
    };

    let entries = getUserTimetableMap(caller);
    let id = entries.size() + 1;
    let entry : TimetableEntry = {
      id;
      title;
      activityType;
      startTime;
      endTime;
      colorCode;
      createdAt = Time.now();
    };
    entries.add(id, entry);
    id;
  };

  public shared ({ caller }) func updateTimetableEntry(id : Nat, newTitle : Text, newActivityType : Text, newColorCode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update timetable entries");
    };

    let entries = getUserTimetableMap(caller);
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Timetable entry not found") };
      case (?entry) {
        let updatedEntry : TimetableEntry = {
          entry with
          title = newTitle;
          activityType = newActivityType;
          colorCode = newColorCode;
        };
        entries.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteTimetableEntry(entryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete timetable entries");
    };

    let entries = getUserTimetableMap(caller);
    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Timetable entry not found") };
      case (?_) {
        entries.remove(entryId);
      };
    };
  };

  public query ({ caller }) func getTimetableEntries() : async [TimetableEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view timetable entries");
    };

    let entries = getUserTimetableMap(caller);
    entries.values().toArray();
  };

  public shared ({ caller }) func getTimetableTickStatsForEntry(entryId : Nat) : async (Nat, [Nat]) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tick stats");
    };

    if (not verifyTimetableEntryOwnership(caller, entryId)) {
      Runtime.trap("Unauthorized: Entry does not belong to caller");
    };

    let currentTime = Time.now();
    let sixMonthsAgo = currentTime - 6 * 30 * 24 * 3600 * 1_000_000_000;

    var totalTicks = 0;
    let monthlyTicks = List.empty<Nat>();

    var monthEnd = currentTime;
    for (month in Nat.range(0, 6)) {
      let monthStart = monthEnd - 30 * 24 * 3600 * 1_000_000_000;
      var monthlyCount = 0;

      for ((tickId, tick) in timetableTicks.entries()) {
        switch (timetableTickOwners.get(tickId)) {
          case (?owner) {
            if (owner == caller and tick.entryId == entryId and tick.timestamp >= monthStart and tick.timestamp < monthEnd) {
              monthlyCount += 1;
            };
          };
          case (null) {};
        };
      };

      monthlyTicks.add(monthlyCount);
      monthEnd := monthStart;
    };

    for ((tickId, tick) in timetableTicks.entries()) {
      switch (timetableTickOwners.get(tickId)) {
        case (?owner) {
          if (owner == caller and tick.entryId == entryId and tick.timestamp >= sixMonthsAgo and tick.timestamp <= currentTime) {
            totalTicks += 1;
          };
        };
        case (null) {};
      };
    };

    var currentDayTicks = 0;
    for ((tickId, tick) in timetableTicks.entries()) {
      switch (timetableTickOwners.get(tickId)) {
        case (?owner) {
          if (owner == caller and tick.entryId == entryId and tick.timestamp > (currentTime - 24 * 3600 * 1_000_000_000)) {
            currentDayTicks += 1;
          };
        };
        case (null) {};
      };
    };

    let ticksArray = monthlyTicks.toArray().reverse();

    (currentDayTicks, ticksArray);
  };

  public shared ({ caller }) func toggleTimetableEntryForToday(entryId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle timetable entries");
    };

    if (not verifyTimetableEntryOwnership(caller, entryId)) {
      Runtime.trap("Unauthorized: Entry does not belong to caller");
    };

    let currentTime = Time.now();

    func isTodayTick(tickId : Nat, tick : TimetableTick) : Bool {
      switch (timetableTickOwners.get(tickId)) {
        case (?owner) {
          owner == caller and tick.entryId == entryId and tick.timestamp > (currentTime - 24 * 3600 * 1_000_000_000)
        };
        case (null) { false };
      };
    };

    let todayTickEntry = timetableTicks.toArray().find(func((tickId, tick)) { isTodayTick(tickId, tick) });
    switch (todayTickEntry) {
      case (?(tickId, _)) {
        timetableTicks.remove(tickId);
        timetableTickOwners.remove(tickId);
        false;
      };
      case (null) {
        let tick : TimetableTick = {
          entryId;
          timestamp = currentTime;
        };
        let tickId = nextTickId;
        nextTickId += 1;
        timetableTicks.add(tickId, tick);
        timetableTickOwners.add(tickId, caller);
        true;
      };
    };
  };

  public query ({ caller }) func getTimetableTickHistoryForEntry(entryId : Nat) : async [TimetableTick] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view timetable tick history");
    };

    if (not verifyTimetableEntryOwnership(caller, entryId)) {
      Runtime.trap("Unauthorized: Entry does not belong to caller");
    };

    timetableTicks.values().toArray().filter(
      func(tick) {
        switch (timetableTickOwners.get(entryId)) {
          case (?owner) { owner == caller and tick.entryId == entryId };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };

    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
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

  public query ({ caller }) func getNewUserNeedsOnboarding() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check onboarding status");
    };

    switch (userProfiles.get(caller)) {
      case (null) { true };
      case (?profile) { not profile.finishedSetup };
    };
  };

  public shared ({ caller }) func updateCallerProfile(profileImage : ?Storage.ExternalBlob, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = { profile with profileImage; bio };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func changeDisplayName(newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can change display name");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let costCoins = if (profile.nameChangeCount == 0) { 0 } else { 50 };

        if (profile.coins < costCoins) {
          Runtime.trap("Insufficient coins to change name");
        };

        let updatedProfile = {
          profile with
          name = newName;
          coins = profile.coins - costCoins;
          nameChangeCount = profile.nameChangeCount + 1;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func initializeProfile(name : Text, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize profiles");
    };

    switch (userProfiles.get(caller)) {
      case (?_) { Runtime.trap("Profile already exists") };
      case (null) {
        let profile : UserProfile = {
          name;
          profileImage = null;
          bio;
          coins = initialCoins;
          nameChangeCount = 0;
          finishedSetup = true;
          dailyStudyGoal = 60; // Default 60 minutes
        };
        userProfiles.add(caller, profile);
      };
    };
  };

  public shared ({ caller }) func markProfileSetupFinished() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark setup as finished");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = { profile with finishedSetup = true };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func addTask(title : Text, description : Text, subject : Text, priority : Nat, tags : [Text], noteId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tasks");
    };

    let tasks = getUserTaskMap(caller);
    let id = tasks.size() + 1;
    let task : Task = {
      id;
      title;
      description;
      subject;
      priority;
      completed = false;
      createdAt = Time.now();
      tags;
      noteId;
      completedAt = null;
    };
    tasks.add(id, task);
    id;
  };

  public shared ({ caller }) func completeTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    let tasks = getUserTaskMap(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask = {
          task with
          completed = true;
          completedAt = ?Time.now();
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    let tasks = getUserTaskMap(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?_) {
        tasks.remove(taskId);
      };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let tasks = getUserTaskMap(caller);
    tasks.values().toArray();
  };

  public query ({ caller }) func getTasksByTag(tag : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    let tasks = getUserTaskMap(caller);
    let allTasks = tasks.values().toArray();
    allTasks.filter(
      func(task) {
        task.tags.findIndex(func(t) { t == tag }) != null;
      }
    );
  };

  public shared ({ caller }) func addNote(title : Text, content : Text, subject : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add notes");
    };

    let notes = getUserNotesMap(caller);
    let noteId = nextNoteId;
    nextNoteId += 1;

    let now = Time.now();
    let newNote : Note = {
      id = noteId;
      title;
      content;
      subject;
      createdAt = now;
      modifiedAt = now;
      imageUrls = [];
      voiceNoteUrls = [];
    };
    notes.add(noteId, newNote);
    noteId;
  };

  public shared ({ caller }) func updateNote(noteId : Nat, title : Text, content : Text, imageUrls : [Storage.ExternalBlob], voiceNoteUrls : [Storage.ExternalBlob]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notes");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        let updatedNote = {
          note with
          title;
          content;
          modifiedAt = Time.now();
          imageUrls;
          voiceNoteUrls;
        };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func deleteNote(noteId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notes");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?_) {
        notes.remove(noteId);
      };
    };
  };

  public shared ({ caller }) func addNoteImage(noteId : Nat, imageUrl : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add note images");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        let updatedImages = note.imageUrls.concat([imageUrl]);
        let updatedNote = { note with imageUrls = updatedImages };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func removeNoteImage(noteId : Nat, imageUrl : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove note images");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        let filteredImages = note.imageUrls.filter(func(url) { url != imageUrl });
        let updatedNote = { note with imageUrls = filteredImages };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func addVoiceNote(noteId : Nat, voiceNoteUrl : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add voice notes");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        let updatedVoiceNotes = note.voiceNoteUrls.concat([voiceNoteUrl]);
        let updatedNote = { note with voiceNoteUrls = updatedVoiceNotes };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func removeVoiceNote(noteId : Nat, voiceNoteUrl : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove voice notes");
    };

    let notes = getUserNotesMap(caller);
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        let filteredVoiceNotes = note.voiceNoteUrls.filter(func(url) { url != voiceNoteUrl });
        let updatedNote = { note with voiceNoteUrls = filteredVoiceNotes };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public query ({ caller }) func getAllNotes() : async [Note] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };

    let notes = getUserNotesMap(caller);
    notes.values().toArray();
  };

  public query ({ caller }) func searchNotes(searchTerm : Text) : async [Note] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search notes");
    };

    let notes = getUserNotesMap(caller);
    let allNotes = notes.values().toArray();
    allNotes.filter(
      func(note) {
        note.title.contains(#text searchTerm) or
        note.content.contains(#text searchTerm)
      }
    );
  };

  public shared ({ caller }) func addReminder(title : Text, reminderTime : Int, noteId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reminders");
    };

    let reminders = getUserRemindersMap(caller);
    let id = reminders.size() + 1;
    let reminder : Reminder = {
      id;
      title;
      reminderTime;
      createdAt = Time.now();
      noteId;
    };
    reminders.add(id, reminder);
    id;
  };

  public shared ({ caller }) func deleteReminder(reminderId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete reminders");
    };

    let reminders = getUserRemindersMap(caller);
    switch (reminders.get(reminderId)) {
      case (null) { Runtime.trap("Reminder not found") };
      case (?_) {
        reminders.remove(reminderId);
      };
    };
  };

  public query ({ caller }) func getUpcomingReminders(currentTime : Int) : async [Reminder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    let reminders = getUserRemindersMap(caller);
    reminders.values().toArray().filter(
      func(reminder) { reminder.reminderTime > currentTime }
    );
  };

  public shared ({ caller }) func recordTimerSession(durationMinutes : Nat, completed : Bool) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record timer sessions");
    };

    let sessions = getUserTimerSessionsMap(caller);
    let sessionId = sessions.size() + 1;
    let session : TimerSessionV2 = {
      sessionId;
      durationMinutes;
      completed;
      createdAt = Time.now();
      isBackground = false;
      endTime = 0;
    };

    sessions.add(sessionId, session);

    if (completed) {
      let useCounts = getUserUseCountsMap(caller);
      let useCountId = useCounts.size() + 1;
      let useCount : UseCount = {
        time = Time.now();
        useSum = durationMinutes;
      };

      useCounts.add(useCountId, useCount);

      let rewardAmount = (durationMinutes * 50) / 60;

      if (rewardAmount > 0) {
        let rewards = getUserCoinRewardsMap(caller);
        let rewardId = rewards.size() + 1;
        let reward : CoinReward = {
          amount = rewardAmount;
          description = "Focus Timer Reward";
          createdAt = Time.now();
        };

        rewards.add(rewardId, reward);

        switch (userProfiles.get(caller)) {
          case (null) { Runtime.trap("Profile not found") };
          case (?profile) {
            let updatedProfile = { profile with coins = profile.coins + rewardAmount };
            userProfiles.add(caller, updatedProfile);
          };
        };
      };

      updateDailySummary(caller, rewardAmount, durationMinutes);
      await updateStreak(caller, durationMinutes);
    };

    sessionId;
  };

  public query ({ caller }) func getTimerSessions() : async [TimerSessionV2] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view timer sessions");
    };

    let sessions = getUserTimerSessionsMap(caller);
    sessions.values().toArray();
  };

  public shared ({ caller }) func purchaseCustomBackground(backgroundId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can purchase backgrounds");
    };

    let owned = getOwnedBackgroundsMap(caller);

    switch (owned.get(backgroundId)) {
      case (?true) {
        return true;
      };
      case (_) {
        switch (userProfiles.get(caller)) {
          case (null) { Runtime.trap("Profile not found") };
          case (?profile) {
            if (profile.coins < backgroundUploadCost) {
              return false;
            };

            let updatedProfile = { profile with coins = profile.coins - backgroundUploadCost };
            userProfiles.add(caller, updatedProfile);

            owned.add(backgroundId, true);
            return true;
          };
        };
      };
    };
  };

  public query ({ caller }) func isBackgroundOwned(backgroundId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check background ownership");
    };

    let owned = getOwnedBackgroundsMap(caller);
    switch (owned.get(backgroundId)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  public shared ({ caller }) func spendCoinsForBackground(rarity : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can spend coins");
    };

    let coinsToSpend = switch (rarity) {
      case ("Normal") { 100 };
      case ("Common") { 150 };
      case ("Rare") { 200 };
      case ("Legendary") { 300 };
      case ("Mythical") { 500 };
      case (_) { Runtime.trap("Invalid rarity tier") };
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        if (profile.coins < coinsToSpend) { return false };
        let updatedProfile = { profile with coins = profile.coins - coinsToSpend };
        userProfiles.add(caller, updatedProfile);
        true;
      };
    };
  };

  public query ({ caller }) func getCoinBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coin balance");
    };

    switch (userProfiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.coins };
    };
  };

  public shared ({ caller }) func startBackgroundFocusTimer(durationMinutes : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start focus timer");
    };

    let timerState : PersistentFocusTimer = {
      remainingMinutes = durationMinutes;
      isActive = true;
    };
    persistentFocusTimers.add(caller, timerState);
  };

  public shared ({ caller }) func updateFocusTimerState(remainingMinutes : Nat, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update focus timer");
    };

    switch (persistentFocusTimers.get(caller)) {
      case (null) {
        let newState : PersistentFocusTimer = {
          remainingMinutes;
          isActive;
        };
        persistentFocusTimers.add(caller, newState);
      };
      case (?_) {
        let updatedState : PersistentFocusTimer = {
          remainingMinutes;
          isActive;
        };
        persistentFocusTimers.add(caller, updatedState);
      };
    };
  };

  public query ({ caller }) func getFocusTimerState() : async ?PersistentFocusTimer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get focus timer state");
    };

    persistentFocusTimers.get(caller);
  };

  public shared ({ caller }) func clearFocusTimer() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear focus timer");
    };

    persistentFocusTimers.remove(caller);
  };

  public query ({ caller }) func getPersistentStopwatchState() : async ?PersistentStopwatch {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get stopwatch state");
    };

    persistentStopwatches.get(caller);
  };

  public shared ({ caller }) func startPersistentStopwatch() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start stopwatch");
    };

    let newState : PersistentStopwatch = {
      startTime = Time.now();
      isRunning = true;
      accumulatedTime = 0;
    };

    persistentStopwatches.add(caller, newState);
  };

  public shared ({ caller }) func pausePersistentStopwatch() {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can pause stopwatch");
    };

    switch (persistentStopwatches.get(caller)) {
      case (null) { Runtime.trap("Stopwatch not running") };
      case (?stopwatch) {
        if (not stopwatch.isRunning) { Runtime.trap("Stopwatch not running") };
        let now = Time.now();
        let elapsed = Int.abs(now - stopwatch.startTime);
        let newAccumulated = stopwatch.accumulatedTime + elapsed;
        let updated : PersistentStopwatch = {
          startTime = 0;
          isRunning = false;
          accumulatedTime = newAccumulated;
        };
        persistentStopwatches.add(caller, updated);
      };
    };
  };

  public shared ({ caller }) func resumePersistentStopwatch() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can resume stopwatch");
    };

    switch (persistentStopwatches.get(caller)) {
      case (null) { Runtime.trap("No stopwatch found") };
      case (?stopwatch) {
        if (stopwatch.isRunning) { Runtime.trap("Stopwatch already running") };
        let updated : PersistentStopwatch = {
          startTime = Time.now();
          isRunning = true;
          accumulatedTime = stopwatch.accumulatedTime;
        };
        persistentStopwatches.add(caller, updated);
      };
    };
  };

  public shared ({ caller }) func resetPersistentStopwatch() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset stopwatch");
    };

    persistentStopwatches.remove(caller);
  };

  public query ({ caller }) func getPersistentStopwatchElapsedTime() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get stopwatch elapsed time");
    };

    switch (persistentStopwatches.get(caller)) {
      case (null) { 0 };
      case (?stopwatch) {
        if (stopwatch.isRunning) {
          let now = Time.now();
          let elapsed = Int.abs(now - stopwatch.startTime);
          let totalElapsed = stopwatch.accumulatedTime + elapsed;
          totalElapsed;
        } else {
          stopwatch.accumulatedTime;
        };
      };
    };
  };

  public query ({ caller }) func getFullPersistentStopwatchState() : async (Bool, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get full stopwatch state");
    };

    switch (persistentStopwatches.get(caller)) {
      case (null) { (false, 0) };
      case (?stopwatch) {
        let elapsed = if (stopwatch.isRunning) {
          let now = Time.now();
          let elapsedTime = Int.abs(now - stopwatch.startTime);
          stopwatch.accumulatedTime + elapsedTime;
        } else {
          stopwatch.accumulatedTime;
        };

        (stopwatch.isRunning, elapsed);
      };
    };
  };

  public shared ({ caller }) func completeStopwatchSession(elapsedMinutes : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete stopwatch sessions");
    };

    let todayRewards = getTodayRewardCount(caller);
    if (todayRewards >= maxDailyStopwatchRewards) {
      updateDailySummary(caller, 0, elapsedMinutes);
      await updateStreak(caller, elapsedMinutes);
      return false;
    };

    let rewardAmount = (elapsedMinutes * 50) / 60;

    if (rewardAmount > 0) {
      let rewards = getUserCoinRewardsMap(caller);
      let rewardId = rewards.size() + 1;
      let reward : CoinReward = {
        amount = rewardAmount;
        description = "Stopwatch Reward";
        createdAt = Time.now();
      };
      rewards.add(rewardId, reward);

      switch (userProfiles.get(caller)) {
        case (null) { Runtime.trap("Profile not found") };
        case (?profile) {
          let updatedProfile = { profile with coins = profile.coins + rewardAmount };
          userProfiles.add(caller, updatedProfile);
        };
      };
    };

    updateDailySummary(caller, rewardAmount, elapsedMinutes);
    await updateStreak(caller, elapsedMinutes);

    true;
  };

  public query ({ caller }) func getStudyStreak() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study streak");
    };

    switch (streakRecords.get(caller)) {
      case (null) { 0 };
      case (?record) { record.streak };
    };
  };

  public query ({ caller }) func getTodayStopwatchRewardCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reward count");
    };

    getTodayRewardCount(caller);
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

  public type LevelStatus = {
    currentStage : LevelStage;
    nextStage : LevelStage;
    userCoins : Nat;
    hasEnoughCoins : Bool;
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

  public query ({ caller }) func getCurrentAndNextLevelStage() : async LevelStatus {
    assertUserAuthorized(caller);

    let currentStage = switch (userLevels.get(caller)) {
      case (null) { defaultLevelStage };
      case (?stage) { stage };
    };

    let nextStage = getNextStage(currentStage);
    let userCoins = getUserCoins(caller);

    {
      currentStage;
      nextStage;
      userCoins;
      hasEnoughCoins = userCoins >= nextStage.requiredCoins;
    };
  };

  public shared ({ caller }) func purchaseNextLevelStage() : async LevelStatus {
    assertUserAuthorized(caller);

    let currentStage = switch (userLevels.get(caller)) {
      case (null) { defaultLevelStage };
      case (?stage) { stage };
    };

    let nextStage = getNextStage(currentStage);
    let userCoins = getUserCoins(caller);

    if (userCoins < nextStage.requiredCoins) {
      Runtime.trap("Not enough coins to purchase next Level stage");
    };

    setUserCoins(caller, userCoins - nextStage.requiredCoins);
    userLevels.add(caller, nextStage);

    {
      currentStage = nextStage;
      nextStage = getNextStage(nextStage);
      userCoins = userCoins - nextStage.requiredCoins;
      hasEnoughCoins = userCoins >= nextStage.requiredCoins;
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

  func assertUserAuthorized(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  // Study graph support - left unchanged

  public type StudySession = {
    durationMinutes : Nat;
    completed : Bool;
    createdAt : Time.Time;
    sessionType : Text; // "pomodoro", "custom", "stopwatch"
  };

  public query ({ caller }) func getWeeklyStudySessions() : async [StudySession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study sessions");
    };

    let timerSessions = getUserTimerSessionsMap(caller).values().toArray();
    let studySessions = timerSessions.map(
      func(session) {
        {
          durationMinutes = session.durationMinutes;
          completed = session.completed;
          createdAt = session.createdAt;
          sessionType = if (session.durationMinutes == 25) { "pomodoro" } else { "custom" };
        };
      }
    );

    // Simulate stopwatch sessions as empty array for now.
    let stopwatchSessions : [StudySession] = [];

    studySessions.concat(stopwatchSessions);
  };

  // New Task Methods

  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, description : Text, subject : Text, priority : Nat, tags : [Text], noteId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    let tasks = getUserTaskMap(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask : Task = {
          task with
          title;
          description;
          subject;
          priority;
          tags;
          noteId;
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func toggleTaskCompletion(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle task completion");
    };

    let tasks = getUserTaskMap(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask = {
          task with
          completed = not task.completed;
          completedAt = if (not task.completed) { ?Time.now() } else { null };
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  // New Reminder Methods

  public shared ({ caller }) func updateReminder(reminderId : Nat, title : Text, reminderTime : Int, noteId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reminders");
    };

    let reminders = getUserRemindersMap(caller);
    switch (reminders.get(reminderId)) {
      case (null) { Runtime.trap("Reminder not found") };
      case (?reminder) {
        let updatedReminder = { reminder with title; reminderTime; noteId };
        reminders.add(reminderId, updatedReminder);
      };
    };
  };

  // Study goal methods
  public query ({ caller }) func getDailyStudyGoal() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view daily study goal");
    };

    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.dailyStudyGoal };
    };
  };

  public shared ({ caller }) func updateDailyStudyGoal(newGoal : Nat) : async Nat {
    assertUserAuthorized(caller);
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = { profile with dailyStudyGoal = newGoal };
        userProfiles.add(caller, updatedProfile);
        newGoal;
      };
    };
  };

  // Streak Freeze Economy Methods

  public shared ({ caller }) func purchaseStreakFreeze() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can purchase Streak Freeze");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        if (profile.coins < streakFreezeCost) {
          Runtime.trap("Insufficient coins to purchase Streak Freeze");
        };

        // Deduct coins
        let updatedCoins = profile.coins - streakFreezeCost;
        let updatedProfile = { profile with coins = updatedCoins };
        userProfiles.add(caller, updatedProfile);

        // Increment Streak Freeze count
        let currentFreezes = switch (userStreakFreezes.get(caller)) {
          case (null) { 0 };
          case (?count) { count };
        };
        userStreakFreezes.add(caller, currentFreezes + 1);
      };
    };
  };

  public query ({ caller }) func getAvailableStreakFreezes() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view available Streak Freezes");
    };

    switch (userStreakFreezes.get(caller)) {
      case (null) { 0 };
      case (?count) { count };
    };
  };

  public shared ({ caller }) func useStreakFreeze() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use Streak Freeze");
    };

    switch (userStreakFreezes.get(caller)) {
      case (null) {
        Runtime.trap("No available Streak Freezes");
      };
      case (?count) {
        if (count == 0) {
          Runtime.trap("No available Streak Freezes");
        };
        userStreakFreezes.add(caller, count - 1);
        true;
      };
    };
  };

  // Updated Study Streak Logic with Streak Freeze support
  func updateStreak(user : Principal, studyMinutes : Nat) : async () {
    if (studyMinutes < 10) {
      return;
    };

    let now = Time.now();
    let today = getDayStart(now);

    switch (streakRecords.get(user)) {
      case (null) {
        let newRecord : StreakRecord = {
          lastActivity = today;
          streak = 1;
        };
        streakRecords.add(user, newRecord);
      };
      case (?record) {
        let lastDay = getDayStart(record.lastActivity);
        let daysDiff : Int = (today - lastDay) / (24 * 3600 * 1_000_000_000);

        if (daysDiff == 0) {
          // Same day, no update needed
          return;
        } else if (daysDiff == 1) {
          // Consecutive day
          let updated : StreakRecord = {
            lastActivity = today;
            streak = record.streak + 1;
          };
          streakRecords.add(user, updated);
        } else if (daysDiff == 2) {
          // Missed exactly one day, can use Streak Freeze
          let availableFreezes = switch (userStreakFreezes.get(user)) {
            case (null) { 0 };
            case (?count) { count };
          };

          if (availableFreezes > 0) {
            // Use one Streak Freeze and continue streak
            userStreakFreezes.add(user, availableFreezes - 1);

            let updated : StreakRecord = {
              lastActivity = today;
              streak = record.streak + 1;
            };
            streakRecords.add(user, updated);
          } else {
            // No Streak Freezes left, streak broken
            let updated : StreakRecord = {
              lastActivity = today;
              streak = 1;
            };
            streakRecords.add(user, updated);
          };
        } else {
          // Missed more than one day, streak broken
          let updated : StreakRecord = {
            lastActivity = today;
            streak = 1;
          };
          streakRecords.add(user, updated);
        };
      };
    };

    // Process Streak Milestone Rewards
    await processStreakMilestoneRewards(user);
  };

  public shared ({ caller }) func hasActiveStudyStreak() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check study streak");
    };

    switch (streakRecords.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Streak Milestone Reward Logic
  private func processStreakMilestoneRewards(user : Principal) : async () {
    let currentStreak = switch (streakRecords.get(user)) {
      case (null) { 0 };
      case (?record) { record.streak };
    };

    let userRewards = switch (userStreakMilestoneRewards.get(user)) {
      case (null) {
        let initialRewards : StreakMilestoneRewards = {
          has10DayReward = false;
          has30DayReward = false;
          hasScholarGoldBadge = false;
        };
        userStreakMilestoneRewards.add(user, initialRewards);
        initialRewards;
      };
      case (?rewards) { rewards };
    };

    // 10-day Streak Reward
    if (currentStreak == 10 and not userRewards.has10DayReward) {
      switch (userProfiles.get(user)) {
        case (null) {};
        case (?profile) {
          let updatedProfile = { profile with coins = profile.coins + 100 };
          userProfiles.add(user, updatedProfile);
        };
      };

      let updatedRewards : StreakMilestoneRewards = {
        userRewards with has10DayReward = true;
      };
      userStreakMilestoneRewards.add(user, updatedRewards);
    };

    // 30-day Streak Reward and Scholar Gold Badge
    if (currentStreak == 30 and not userRewards.has30DayReward) {
      switch (userProfiles.get(user)) {
        case (null) {};
        case (?profile) {
          let updatedProfile = { profile with coins = profile.coins + 500 };
          userProfiles.add(user, updatedProfile);
        };
      };

      let updatedRewards : StreakMilestoneRewards = {
        userRewards with has30DayReward = true;
        hasScholarGoldBadge = true;
      };
      userStreakMilestoneRewards.add(user, updatedRewards);
    };
  };

  public query ({ caller }) func getStreakMilestoneRewards() : async StreakMilestoneRewards {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view streak milestone rewards");
    };

    switch (userStreakMilestoneRewards.get(caller)) {
      case (null) {
        {
          has10DayReward = false;
          has30DayReward = false;
          hasScholarGoldBadge = false;
        };
      };
      case (?rewards) { rewards };
    };
  };
};
