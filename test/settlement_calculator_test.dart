import 'package:flutter_test/flutter_test.dart';
import 'package:flat_expense_manager/data/models/expense_model.dart';
import 'package:flat_expense_manager/data/models/expense_split_model.dart';
import 'package:flat_expense_manager/data/models/member_model.dart';
import 'package:flat_expense_manager/data/models/settlement_model.dart';
import 'package:flat_expense_manager/domain/settlement_calculator.dart';

void main() {
  group('SettlementCalculator Tests', () {
    final now = DateTime(2026, 10, 14);

    final memberA = MemberModel(
      id: 'user_a',
      groupId: 'flat_1',
      name: 'User A',
      isCurrentUser: true,
      joinedAt: now,
      updatedAt: now,
    );

    final memberB = MemberModel(
      id: 'user_b',
      groupId: 'flat_1',
      name: 'User B',
      isCurrentUser: false,
      joinedAt: now,
      updatedAt: now,
    );

    test('Section 10 Requirement: Equal split where User A pays ₹2000 and User B pays ₹1000', () {
      // User A paid ₹2,000, shared equally
      final expA = ExpenseModel(
        id: 'exp_1',
        groupId: 'flat_1',
        title: 'Grocery',
        amount: 2000.0,
        category: 'grocery',
        purchaseDate: now,
        payerMemberId: 'user_a',
        splitMethod: 'equal',
        createdByMemberId: 'user_a',
        createdAt: now,
        updatedAt: now,
        splits: [
          ExpenseSplitModel(
            id: 'spl_1',
            expenseId: 'exp_1',
            memberId: 'user_a',
            allocatedAmount: 1000.0,
            createdAt: now,
            updatedAt: now,
          ),
          ExpenseSplitModel(
            id: 'spl_2',
            expenseId: 'exp_1',
            memberId: 'user_b',
            allocatedAmount: 1000.0,
            createdAt: now,
            updatedAt: now,
          ),
        ],
      );

      // User B paid ₹1,000, shared equally
      final expB = ExpenseModel(
        id: 'exp_2',
        groupId: 'flat_1',
        title: 'Vegetables',
        amount: 1000.0,
        category: 'veg_fruits',
        purchaseDate: now,
        payerMemberId: 'user_b',
        splitMethod: 'equal',
        createdByMemberId: 'user_b',
        createdAt: now,
        updatedAt: now,
        splits: [
          ExpenseSplitModel(
            id: 'spl_3',
            expenseId: 'exp_2',
            memberId: 'user_a',
            allocatedAmount: 500.0,
            createdAt: now,
            updatedAt: now,
          ),
          ExpenseSplitModel(
            id: 'spl_4',
            expenseId: 'exp_2',
            memberId: 'user_b',
            allocatedAmount: 500.0,
            createdAt: now,
            updatedAt: now,
          ),
        ],
      );

      final result = SettlementCalculator.calculate(
        members: [memberA, memberB],
        expenses: [expA, expB],
        settlements: [],
        currentUserId: 'user_a',
      );

      // Total shared expense = 3,000
      expect(result.totalGroupExpense, 3000.0);

      // User A paid 2,000, share is 1,500 -> net balance = +500
      expect(result.currentUserNetBalance, 500.0);
      expect(result.currentUserTotalPaid, 2000.0);
      expect(result.currentUserTotalShare, 1500.0);

      // User B balance = -500
      expect(result.memberBalances['user_b'], -500.0);

      // Suggested transfer: User B owes User A ₹500
      expect(result.suggestedTransfers.length, 1);
      final transfer = result.suggestedTransfers.first;
      expect(transfer.fromMemberId, 'user_b');
      expect(transfer.toMemberId, 'user_a');
      expect(transfer.amount, 500.0);
    });

    test('Settlement record clears outstanding balance without affecting total expense', () {
      final exp = ExpenseModel(
        id: 'exp_1',
        groupId: 'flat_1',
        title: 'Rent',
        amount: 2000.0,
        category: 'rent',
        purchaseDate: now,
        payerMemberId: 'user_a',
        createdByMemberId: 'user_a',
        createdAt: now,
        updatedAt: now,
        splits: [
          ExpenseSplitModel(
            id: 's1',
            expenseId: 'exp_1',
            memberId: 'user_a',
            allocatedAmount: 1000.0,
            createdAt: now,
            updatedAt: now,
          ),
          ExpenseSplitModel(
            id: 's2',
            expenseId: 'exp_1',
            memberId: 'user_b',
            allocatedAmount: 1000.0,
            createdAt: now,
            updatedAt: now,
          ),
        ],
      );

      // User B settles ₹1000 to User A
      final settlement = SettlementModel(
        id: 'settle_1',
        groupId: 'flat_1',
        fromMemberId: 'user_b',
        toMemberId: 'user_a',
        amount: 1000.0,
        settledAt: now,
        createdAt: now,
        updatedAt: now,
      );

      final result = SettlementCalculator.calculate(
        members: [memberA, memberB],
        expenses: [exp],
        settlements: [settlement],
        currentUserId: 'user_a',
      );

      expect(result.totalGroupExpense, 2000.0);
      expect(result.currentUserNetBalance, 0.0);
      expect(result.memberBalances['user_b'], 0.0);
      expect(result.suggestedTransfers.isEmpty, true);
    });
  });
}
