import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";

module {
  public type OldActor = {
    levelRanks : [Text];
  };

  public type NewActor = {
    levelRanks : [Text];
  };

  public func run(old : OldActor) : NewActor {
    let updatedLevelRanks = switch (old.levelRanks.findIndex(func(rank) { rank == "Sigma Student 🗿" })) {
      case (null) { old.levelRanks };
      case (?index) {
        old.levelRanks.map(
          func(rank) {
            if (old.levelRanks.indexOf(rank) == ?index) { "Topper Student🏆" } else { rank };
          }
        );
      };
    };

    { old with levelRanks = updatedLevelRanks };
  };
};

