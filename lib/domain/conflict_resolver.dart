class ConflictResolver {
  /// Evaluates whether incoming entity data should overwrite local entity data
  /// Uses Last-Write-Wins (LWW) based on updatedAt timestamp.
  /// If timestamps are identical, uses deterministic tie-breaker.
  static bool shouldIncomingOverwrite({
    required DateTime localUpdatedAt,
    required DateTime incomingUpdatedAt,
    required String localId,
    required String incomingId,
  }) {
    if (incomingUpdatedAt.isAfter(localUpdatedAt)) {
      return true;
    } else if (incomingUpdatedAt.isBefore(localUpdatedAt)) {
      return false;
    } else {
      // Deterministic tie-breaker
      return incomingId.compareTo(localId) >= 0;
    }
  }
}
