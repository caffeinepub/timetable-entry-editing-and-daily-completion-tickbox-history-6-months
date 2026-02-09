module {
  type ActorState = {
    // No state changes, only new methods
  };

  public func run(old : ActorState) : ActorState {
    old;
  };
};
