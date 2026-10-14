import 'package:flutter_test/flutter_test.dart';
import 'package:flat_expense_manager/data/models/group_model.dart';
import 'package:flat_expense_manager/data/models/pairing_payload.dart';
import 'package:flat_expense_manager/data/models/shopping_item_model.dart';

void main() {
  group('Models Serialization Tests', () {
    test('GroupModel serialization and deserialization', () {
      final now = DateTime(2026, 10, 14, 12, 0, 0);
      final group = GroupModel(
        id: 'group_123',
        name: 'Bhawani Flat',
        currency: '₹',
        currencyCode: 'INR',
        pairingCode: 'FLAT2026',
        pairingSecret: 'secret_token_abc',
        createdAt: now,
        updatedAt: now,
      );

      final map = group.toMap();
      final restored = GroupModel.fromMap(map);

      expect(restored.id, group.id);
      expect(restored.name, group.name);
      expect(restored.currency, '₹');
      expect(restored.pairingCode, 'FLAT2026');
      expect(restored.pairingSecret, 'secret_token_abc');
    });

    test('PairingPayload QR string encode & decode', () {
      final payload = PairingPayload(
        groupId: 'grp_999',
        groupName: 'Green Residency 302',
        currency: '₹',
        pairingCode: 'GR302',
        pairingToken: 'sec_xyz_123',
        hostIp: '192.168.1.100',
        port: 8089,
        senderDeviceId: 'dev_phone_1',
        senderMemberName: 'Bhawani',
      );

      final qrString = payload.toQrString();
      final parsed = PairingPayload.fromQrString(qrString);

      expect(parsed, isNotNull);
      expect(parsed!.groupId, 'grp_999');
      expect(parsed.groupName, 'Green Residency 302');
      expect(parsed.hostIp, '192.168.1.100');
      expect(parsed.port, 8089);
      expect(parsed.pairingToken, 'sec_xyz_123');
      expect(parsed.senderMemberName, 'Bhawani');
    });

    test('ShoppingItemModel serialization with conversion details', () {
      final now = DateTime(2026, 10, 14, 15, 30, 0);
      final item = ShoppingItemModel(
        id: 'shop_1',
        groupId: 'grp_1',
        name: 'Wheat flour',
        quantity: 5.0,
        unit: 'kg',
        estimatedPrice: 250.0,
        actualPrice: 240.0,
        priority: 'high',
        assignedMemberId: 'user_b',
        addedByMemberId: 'user_a',
        status: 'purchased',
        convertedExpenseId: 'exp_from_shop_1',
        createdAt: now,
        updatedAt: now,
      );

      final map = item.toMap();
      final restored = ShoppingItemModel.fromMap(map);

      expect(restored.id, item.id);
      expect(restored.quantity, 5.0);
      expect(restored.unit, 'kg');
      expect(restored.actualPrice, 240.0);
      expect(restored.status, 'purchased');
      expect(restored.convertedExpenseId, 'exp_from_shop_1');
    });
  });
}
