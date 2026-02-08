/**
 * Maps backend error messages to user-friendly English messages
 */
export function mapBackendError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred';
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Max level errors
  if (errorMessage.includes('maximum Level') || errorMessage.includes('max level')) {
    return 'You have already reached the maximum level!';
  }

  // Insufficient coins
  if (errorMessage.includes('Not enough coins') || errorMessage.includes('Insufficient coins')) {
    return 'You do not have enough coins for this action';
  }

  // Profile errors
  if (errorMessage.includes('Profile not found')) {
    return 'Your profile could not be found. Please try logging in again.';
  }

  // Authorization errors
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('permission')) {
    return 'You do not have permission to perform this action';
  }

  // Generic fallback
  return 'An error occurred. Please try again.';
}
