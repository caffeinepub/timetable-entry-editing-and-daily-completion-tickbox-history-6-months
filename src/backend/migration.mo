import Map "mo:core/Map";
import Principal "mo:core/Principal";

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

  public func run(old : OldActor) : NewActor {
    old;
  };
};
