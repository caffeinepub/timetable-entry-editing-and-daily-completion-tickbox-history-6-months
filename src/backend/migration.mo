import Map "mo:core/Map";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
  type OldTask = {
    id : Nat;
    title : Text;
    description : Text;
    subject : Text;
    priority : Nat;
    completed : Bool;
    createdAt : Time.Time;
  };

  type OldReminder = {
    id : Nat;
    title : Text;
    reminderTime : Int;
    createdAt : Time.Time;
  };

  type OldUserProfile = {
    name : Text;
    profileImage : ?Storage.ExternalBlob;
    bio : Text;
    coins : Nat;
    nameChangeCount : Nat;
    finishedSetup : Bool;
  };

  type OldActor = {
    userTasks : Map.Map<Principal, Map.Map<Nat, OldTask>>;
    userReminders : Map.Map<Principal, Map.Map<Nat, OldReminder>>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewTask = {
    id : Nat;
    title : Text;
    description : Text;
    subject : Text;
    priority : Nat;
    completed : Bool;
    createdAt : Time.Time;
    tags : [Text];
    noteId : ?Nat;
  };

  type NewReminder = {
    id : Nat;
    title : Text;
    reminderTime : Int;
    createdAt : Time.Time;
    noteId : ?Nat;
  };

  type NewUserProfile = {
    name : Text;
    profileImage : ?Storage.ExternalBlob;
    bio : Text;
    coins : Nat;
    nameChangeCount : Nat;
    finishedSetup : Bool;
    dailyStudyGoal : Nat;
  };

  type NewActor = {
    userTasks : Map.Map<Principal, Map.Map<Nat, NewTask>>;
    userReminders : Map.Map<Principal, Map.Map<Nat, NewReminder>>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserTasks = old.userTasks.map<Principal, Map.Map<Nat, OldTask>, Map.Map<Nat, NewTask>>(
      func(_principal, oldTasks) {
        oldTasks.map<Nat, OldTask, NewTask>(
          func(_id, oldTask) {
            {
              id = oldTask.id;
              title = oldTask.title;
              description = oldTask.description;
              subject = oldTask.subject;
              priority = oldTask.priority;
              completed = oldTask.completed;
              createdAt = oldTask.createdAt;
              tags = [];
              noteId = null;
            };
          }
        );
      }
    );

    let newUserReminders = old.userReminders.map<Principal, Map.Map<Nat, OldReminder>, Map.Map<Nat, NewReminder>>(
      func(_principal, oldReminders) {
        oldReminders.map<Nat, OldReminder, NewReminder>(
          func(_id, oldReminder) {
            {
              id = oldReminder.id;
              title = oldReminder.title;
              reminderTime = oldReminder.reminderTime;
              createdAt = oldReminder.createdAt;
              noteId = null;
            };
          }
        );
      }
    );

    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        {
          name = oldProfile.name;
          profileImage = oldProfile.profileImage;
          bio = oldProfile.bio;
          coins = oldProfile.coins;
          nameChangeCount = oldProfile.nameChangeCount;
          finishedSetup = oldProfile.finishedSetup;
          dailyStudyGoal = 60;
        };
      }
    );

    {
      old with
      userTasks = newUserTasks;
      userReminders = newUserReminders;
      userProfiles = newUserProfiles;
    };
  };
};
