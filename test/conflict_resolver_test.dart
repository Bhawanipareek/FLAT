import 'package:flutter_test/flutter_test.dart';
import 'package:flat_expense_manager/domain/conflict_resolver.dart';

void main() {
  group('ConflictResolver Tests', () {
    test('Incoming record with newer timestamp overwrites older local record', () {
      final localTime = DateTime(2026, 10, 14, 10, 0, 0);
      final incomingTime = DateTime(2026, 10, 14, 10, 5, 0);

      final overwrite = ConflictResolver.shouldIncomingOverwrite(
        localUpdatedAt: localTime,
        incomingUpdatedAt: incomingTime,
        localId: 'record_1',
        incomingId: 'record_1',
      );

      expect(overwrite, true);
    });

    test('Incoming record with older timestamp does not overwrite newer local record', () {
      final localTime = DateTime(2026, 10, 14, 10, 5, 0);
      final incomingTime = DateTime(2026, 10, 14, 10, 0, 0);

      final overwrite = ConflictResolver.shouldIncomingOverwrite(
        localUpdatedAt: localTime,
        incomingUpdatedAt: incomingTime,
        localId: 'record_1',
        incomingId: 'record_1',
      );

      expect(overwrite, false);
    });

    test('Identical timestamps use deterministic tie-breaking', () {
      final time = DateTime(2026, 10, 14, 10, 0, 0);

      final overwrite = ConflictResolver.shouldIncomingOverwrite(
        localUpdatedAt: time,
        incomingUpdatedAt: time,
        localId: 'abc',
        incomingId: 'xyz',
      );

      expect(overwrite, true); // 'xyz' >= 'abc'
    });
  });
}
