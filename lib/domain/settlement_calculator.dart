import '../data/models/expense_model.dart';
import '../data/models/member_model.dart';
import '../data/models/settlement_model.dart';

class DebtTransfer {
  final String fromMemberId;
  final String toMemberId;
  final double amount;

  DebtTransfer({
    required this.fromMemberId,
    required this.toMemberId,
    required this.amount,
  });

  @override
  String toString() => '$fromMemberId owes $toMemberId: $amount';
}

class SettlementCalculationResult {
  final Map<String, double> memberBalances; // positive = creditor (to receive), negative = debtor (to pay)
  final List<DebtTransfer> suggestedTransfers;
  final double totalGroupExpense;
  final double currentUserNetBalance;
  final double currentUserTotalPaid;
  final double currentUserTotalShare;

  SettlementCalculationResult({
    required this.memberBalances,
    required this.suggestedTransfers,
    required this.totalGroupExpense,
    required this.currentUserNetBalance,
    required this.currentUserTotalPaid,
    required this.currentUserTotalShare,
  });
}

class SettlementCalculator {
  /// Computes exact net balances for all members and simplifies debts
  static SettlementCalculationResult calculate({
    required List<MemberModel> members,
    required List<ExpenseModel> expenses,
    required List<SettlementModel> settlements,
    required String currentUserId,
  }) {
    final Map<String, double> balances = {};
    for (final member in members) {
      balances[member.id] = 0.0;
    }

    double totalGroupExpense = 0.0;
    double currentUserTotalPaid = 0.0;
    double currentUserTotalShare = 0.0;

    // 1. Process Expenses & Splits
    for (final expense in expenses) {
      if (expense.isDeleted) continue;

      totalGroupExpense += expense.amount;

      // Payer gets credited
      balances[expense.payerMemberId] =
          (balances[expense.payerMemberId] ?? 0.0) + expense.amount;

      if (expense.payerMemberId == currentUserId) {
        currentUserTotalPaid += expense.amount;
      }

      // Each split member gets debited
      if (expense.splits.isNotEmpty) {
        for (final split in expense.splits) {
          if (split.isDeleted) continue;
          balances[split.memberId] =
              (balances[split.memberId] ?? 0.0) - split.allocatedAmount;

          if (split.memberId == currentUserId) {
            currentUserTotalShare += split.allocatedAmount;
          }
        }
      } else {
        // Fallback equal split among all members if no explicit splits
        final count = members.isEmpty ? 1 : members.length;
        final share = expense.amount / count;
        for (final member in members) {
          balances[member.id] = (balances[member.id] ?? 0.0) - share;
          if (member.id == currentUserId) {
            currentUserTotalShare += share;
          }
        }
      }
    }

    // 2. Process Settlements (Settlements update balances without counting as new expenses)
    for (final settlement in settlements) {
      if (settlement.isDeleted) continue;

      // fromMember paid money -> increases their balance (reduces debt)
      balances[settlement.fromMemberId] =
          (balances[settlement.fromMemberId] ?? 0.0) + settlement.amount;

      // toMember received money -> decreases their balance (satisfies credit)
      balances[settlement.toMemberId] =
          (balances[settlement.toMemberId] ?? 0.0) - settlement.amount;
    }

    // 3. Debt Minimization Algorithm (Greedy Debt Simplification)
    final suggestedTransfers = _simplifyDebts(Map.from(balances));

    final currentUserNetBalance = balances[currentUserId] ?? 0.0;

    return SettlementCalculationResult(
      memberBalances: balances,
      suggestedTransfers: suggestedTransfers,
      totalGroupExpense: totalGroupExpense,
      currentUserNetBalance: currentUserNetBalance,
      currentUserTotalPaid: currentUserTotalPaid,
      currentUserTotalShare: currentUserTotalShare,
    );
  }

  /// Simplifies multi-party debts into minimal peer-to-peer transfers
  static List<DebtTransfer> _simplifyDebts(Map<String, double> balances) {
    final List<DebtTransfer> transfers = [];

    // Separate debtors (< 0) and creditors (> 0)
    final debtors = <MapEntry<String, double>>[];
    final creditors = <MapEntry<String, double>>[];

    balances.forEach((memberId, balance) {
      // Round to 2 decimal places to avoid floating point precision noise
      final rounded = double.parse(balance.toStringAsFixed(2));
      if (rounded < -0.01) {
        debtors.add(MapEntry(memberId, -rounded)); // Store positive debt amount
      } else if (rounded > 0.01) {
        creditors.add(MapEntry(memberId, rounded));
      }
    });

    // Sort descending by amount
    debtors.sort((a, b) => b.value.compareTo(a.value));
    creditors.sort((a, b) => b.value.compareTo(a.value));

    int debtorIndex = 0;
    int creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      final debtor = debtors[debtorIndex];
      final creditor = creditors[creditorIndex];

      final minAmount = debtor.value < creditor.value ? debtor.value : creditor.value;
      final roundedTransfer = double.parse(minAmount.toStringAsFixed(2));

      if (roundedTransfer > 0.01) {
        transfers.add(DebtTransfer(
          fromMemberId: debtor.key,
          toMemberId: creditor.key,
          amount: roundedTransfer,
        ));
      }

      debtors[debtorIndex] = MapEntry(debtor.key, debtor.value - minAmount);
      creditors[creditorIndex] = MapEntry(creditor.key, creditor.value - minAmount);

      if (debtors[debtorIndex].value < 0.01) {
        debtorIndex++;
      }
      if (creditors[creditorIndex].value < 0.01) {
        creditorIndex++;
      }
    }

    return transfers;
  }
}
