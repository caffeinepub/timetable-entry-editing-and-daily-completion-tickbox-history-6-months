import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";

module {
  type LevelStage = {
    level : Nat;
    rank : Text;
    displayText : Text;
    requiredCoins : Nat;
  };

  type OldActor = {
    userLevels : Map.Map<Principal, LevelStage>;
  };

  type NewActor = {
    userLevels : Map.Map<Principal, LevelStage>;
  };

  func cleanInvalidRanks(old : Map.Map<Principal, LevelStage>) : Map.Map<Principal, LevelStage> {
    let validRanks = [
      "Noob",
      "Beginner 📈",
      "Advanced Student 💪🏻",
      "Pro Student 🔥",
      "Sigma Student 🗿",
    ];

    let iter = old.entries();

    let filteredIter = iter.map(
      func((principal, stage)) {
        if (validRanks.find(func(valid) { valid == stage.rank }) != null) {
          ?(principal, stage);
        } else {
          null;
        };
      }
    ).filter(func(entry) { entry != null });

    Map.fromIter<Principal, LevelStage>(filteredIter.map(func(entry) { entry.unwrap() }));
  };

  public func run(old : OldActor) : NewActor {
    { userLevels = cleanInvalidRanks(old.userLevels) };
  };
};
