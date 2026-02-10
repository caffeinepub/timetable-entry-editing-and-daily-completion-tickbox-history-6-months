export function getBackendErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    // Handle Motoko trap messages
    if (error.includes('Unauthorized')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.includes('Profile not found')) {
      return 'User profile not found. Please set up your profile first.';
    }
    if (error.includes('Task not found')) {
      return 'The task you are trying to access does not exist.';
    }
    if (error.includes('Note not found')) {
      return 'The note you are trying to access does not exist.';
    }
    if (error.includes('Reminder not found')) {
      return 'The reminder you are trying to access does not exist.';
    }
    if (error.includes('Timetable entry not found')) {
      return 'The timetable entry you are trying to access does not exist.';
    }
    if (error.includes('Insufficient coins')) {
      return 'You do not have enough coins for this purchase.';
    }
    if (error.includes('Not enough coins')) {
      return 'You do not have enough coins for this action.';
    }
    if (error.includes('Profile already exists')) {
      return 'Your profile has already been set up.';
    }
    if (error.includes('Stopwatch not running')) {
      return 'The stopwatch is not currently running.';
    }
    if (error.includes('Stopwatch already running')) {
      return 'The stopwatch is already running.';
    }
    if (error.includes('No stopwatch found')) {
      return 'No stopwatch session found.';
    }
    if (error.includes('No available Streak Freezes')) {
      return 'You do not have any Streak Freezes available.';
    }
    if (error.includes('Insufficient coins to purchase Streak Freeze')) {
      return 'You need 50 coins to purchase a Streak Freeze.';
    }
    if (error.includes('Not enough coins to purchase next Level stage')) {
      return 'You do not have enough coins to upgrade your level.';
    }
    
    // Return the original error if no specific mapping found
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
