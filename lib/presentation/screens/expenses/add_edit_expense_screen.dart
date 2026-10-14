import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/expense_categories.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/id_generator.dart';
import '../../../data/models/expense_model.dart';
import '../../../data/models/expense_split_model.dart';
import '../../../data/models/member_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/expenses_provider.dart';

class AddEditExpenseScreen extends StatefulWidget {
  final ExpenseModel? existingExpense;

  const AddEditExpenseScreen({super.key, this.existingExpense});

  @override
  State<AddEditExpenseScreen> createState() => _AddEditExpenseScreenState();
}

class _AddEditExpenseScreenState extends State<AddEditExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _amountController;
  late TextEditingController _notesController;

  late String _selectedCategory;
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  String? _selectedPayerId;
  String _splitMethod = 'equal'; // 'equal', 'custom', 'percentage', 'personal'
  bool _isPersonal = false;

  final Set<String> _selectedMemberIds = {};
  final Map<String, TextEditingController> _customControllers = {};
  String? _receiptImagePath;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final expense = widget.existingExpense;

    _titleController = TextEditingController(text: expense?.title ?? '');
    _amountController = TextEditingController(
      text: expense != null ? expense.amount.toStringAsFixed(2) : '',
    );
    _notesController = TextEditingController(text: expense?.notes ?? '');
    _selectedCategory = expense?.category ?? ExpenseCategories.all.first.id;
    _selectedDate = expense?.purchaseDate ?? DateTime.now();
    _selectedTime = expense != null
        ? TimeOfDay.fromDateTime(expense.purchaseDate)
        : TimeOfDay.now();
    _selectedPayerId = expense?.payerMemberId;
    _splitMethod = expense?.splitMethod ?? 'equal';
    _isPersonal = expense?.splitMethod == 'personal';
    _receiptImagePath = expense?.receiptImagePath;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppStateProvider>();
      if (_selectedPayerId == null) {
        setState(() {
          _selectedPayerId = appState.currentUserMember?.id ??
              (appState.members.isNotEmpty ? appState.members.first.id : null);
        });
      }

      if (expense != null && expense.splits.isNotEmpty) {
        for (final split in expense.splits) {
          _selectedMemberIds.add(split.memberId);
          _customControllers[split.memberId] = TextEditingController(
            text: _splitMethod == 'percentage'
                ? (split.allocatedPercentage?.toStringAsFixed(1) ?? '0')
                : split.allocatedAmount.toStringAsFixed(2),
          );
        }
      } else {
        // Default select all members
        for (final m in appState.members) {
          _selectedMemberIds.add(m.id);
          _customControllers[m.id] = TextEditingController();
        }
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    for (final c in _customControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickReceiptImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 75);
    if (picked != null) {
      setState(() {
        _receiptImagePath = picked.path;
      });
    }
  }

  void _calculateEqualSplits() {
    final totalAmount = double.tryParse(_amountController.text) ?? 0.0;
    if (_selectedMemberIds.isEmpty || totalAmount <= 0) return;

    final share = totalAmount / _selectedMemberIds.length;
    for (final mId in _selectedMemberIds) {
      _customControllers[mId]?.text = share.toStringAsFixed(2);
    }
  }

  List<ExpenseSplitModel> _buildSplits(String expenseId, double totalAmount) {
    final now = DateTime.now();
    final splits = <ExpenseSplitModel>[];

    if (_isPersonal) {
      final payerId = _selectedPayerId ?? '';
      splits.add(ExpenseSplitModel(
        id: IdGenerator.generateId(),
        expenseId: expenseId,
        memberId: payerId,
        allocatedAmount: totalAmount,
        allocatedPercentage: 100.0,
        createdAt: now,
        updatedAt: now,
      ));
      return splits;
    }

    if (_splitMethod == 'equal') {
      final share = totalAmount / _selectedMemberIds.length;
      final pct = 100.0 / _selectedMemberIds.length;
      for (final mId in _selectedMemberIds) {
        splits.add(ExpenseSplitModel(
          id: IdGenerator.generateId(),
          expenseId: expenseId,
          memberId: mId,
          allocatedAmount: double.parse(share.toStringAsFixed(2)),
          allocatedPercentage: pct,
          createdAt: now,
          updatedAt: now,
        ));
      }
    } else if (_splitMethod == 'percentage') {
      for (final mId in _selectedMemberIds) {
        final pct = double.tryParse(_customControllers[mId]?.text ?? '0') ?? 0.0;
        final share = (totalAmount * pct) / 100.0;
        splits.add(ExpenseSplitModel(
          id: IdGenerator.generateId(),
          expenseId: expenseId,
          memberId: mId,
          allocatedAmount: double.parse(share.toStringAsFixed(2)),
          allocatedPercentage: pct,
          createdAt: now,
          updatedAt: now,
        ));
      }
    } else {
      // Custom amount
      for (final mId in _selectedMemberIds) {
        final share = double.tryParse(_customControllers[mId]?.text ?? '0') ?? 0.0;
        splits.add(ExpenseSplitModel(
          id: IdGenerator.generateId(),
          expenseId: expenseId,
          memberId: mId,
          allocatedAmount: double.parse(share.toStringAsFixed(2)),
          allocatedPercentage: totalAmount > 0 ? (share / totalAmount) * 100 : null,
          createdAt: now,
          updatedAt: now,
        ));
      }
    }

    return splits;
  }

  Future<void> _submitExpense() async {
    if (!_formKey.currentState!.validate()) return;

    final totalAmount = double.tryParse(_amountController.text) ?? 0.0;
    if (totalAmount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount greater than 0')),
      );
      return;
    }

    if (!_isPersonal && _selectedMemberIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one member to share the expense')),
      );
      return;
    }

    // Validate custom / percentage sums only for shared expenses
    if (!_isPersonal) {
      if (_splitMethod == 'custom') {
        double customSum = 0.0;
        for (final mId in _selectedMemberIds) {
          customSum += double.tryParse(_customControllers[mId]?.text ?? '0') ?? 0.0;
        }
        if ((customSum - totalAmount).abs() > 0.05) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Custom amounts sum (₹${customSum.toStringAsFixed(2)}) does not match total (₹${totalAmount.toStringAsFixed(2)})',
              ),
            ),
          );
          return;
        }
      } else if (_splitMethod == 'percentage') {
        double pctSum = 0.0;
        for (final mId in _selectedMemberIds) {
          pctSum += double.tryParse(_customControllers[mId]?.text ?? '0') ?? 0.0;
        }
        if ((pctSum - 100.0).abs() > 0.5) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Percentages sum (${pctSum.toStringAsFixed(1)}%) must equal 100%'),
            ),
          );
          return;
        }
      }
    }

    setState(() => _isSaving = true);

    final appState = context.read<AppStateProvider>();
    final expensesProv = context.read<ExpensesProvider>();

    final fullPurchaseDate = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _selectedTime.hour,
      _selectedTime.minute,
    );

    final expenseId = widget.existingExpense?.id ?? IdGenerator.generateId();
    final splits = _buildSplits(expenseId, totalAmount);

    try {
      await expensesProv.saveExpense(
        groupId: appState.activeGroup!.id,
        existingId: expenseId,
        title: _titleController.text.trim(),
        amount: totalAmount,
        category: _selectedCategory,
        purchaseDate: fullPurchaseDate,
        payerMemberId: _selectedPayerId!,
        splitMethod: _splitMethod,
        splits: splits,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        receiptImagePath: _receiptImagePath,
        currentUserId: appState.currentUserId!,
      );

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save expense: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final members = appState.members;
    final currency = appState.activeGroup?.currency ?? '₹';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existingExpense == null ? 'Add Expense' : 'Edit Expense'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _submitExpense,
            child: _isSaving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Expense Title',
                hintText: 'e.g. Milk & Eggs, Wi-Fi Bill, Grocery',
                prefixIcon: Icon(Icons.edit_note_rounded),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Enter a title' : null,
            ),
            const SizedBox(height: 16),

            // Amount
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                labelText: 'Amount ($currency)',
                hintText: '0.00',
                prefixText: '$currency ',
                prefixStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              onChanged: (_) {
                if (_splitMethod == 'equal') {
                  _calculateEqualSplits();
                }
              },
              validator: (v) {
                if (v == null || v.isEmpty) return 'Enter amount';
                final val = double.tryParse(v);
                if (val == null || val <= 0) return 'Enter valid amount > 0';
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Category Selector
            const Text(
              'Category',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ExpenseCategories.all.map((cat) {
                final isSelected = _selectedCategory == cat.id;
                return ChoiceChip(
                  avatar: Icon(cat.icon, size: 16, color: isSelected ? Colors.white : cat.color),
                  label: Text(cat.name),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : null,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedCategory = cat.id);
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Date & Time pickers
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setState(() => _selectedDate = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Purchase Date',
                        prefixIcon: Icon(Icons.calendar_today_rounded),
                      ),
                      child: Text(DateFormat('dd MMM yyyy').format(_selectedDate)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: _selectedTime,
                      );
                      if (picked != null) {
                        setState(() => _selectedTime = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Time',
                        prefixIcon: Icon(Icons.access_time_rounded),
                      ),
                      child: Text(_selectedTime.format(context)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Paid By (Dropdown)
            DropdownButtonFormField<String>(
              value: _selectedPayerId,
              decoration: const InputDecoration(
                labelText: 'Paid By',
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
              items: members.map((m) {
                return DropdownMenuItem(
                  value: m.id,
                  child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _selectedPayerId = val);
              },
            ),
            const SizedBox(height: 20),

            // Personal vs Shared Flat Expense Switch
            Card(
              margin: EdgeInsets.zero,
              color: _isPersonal ? AppColors.secondary.withOpacity(0.08) : Colors.grey.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: _isPersonal ? AppColors.secondary : Colors.grey.shade300,
                  width: _isPersonal ? 1.5 : 1,
                ),
              ),
              child: SwitchListTile(
                secondary: Icon(
                  _isPersonal ? Icons.person_rounded : Icons.groups_rounded,
                  color: _isPersonal ? AppColors.secondary : AppColors.primary,
                ),
                title: Text(
                  _isPersonal ? 'Personal Expense (Mera Niji Kharcha)' : 'Flat Shared Expense (Flatmates Me Batega)',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                subtitle: Text(
                  _isPersonal
                      ? 'Sirf aapka kharcha hai — Flatmates ke hisab me nahi aayega.'
                      : 'Flatmates ke beech hisab me divide hoga.',
                  style: const TextStyle(fontSize: 12),
                ),
                value: _isPersonal,
                onChanged: (val) {
                  setState(() {
                    _isPersonal = val;
                    _splitMethod = val ? 'personal' : 'equal';
                    if (!val && _selectedMemberIds.isEmpty) {
                      for (final m in members) {
                        _selectedMemberIds.add(m.id);
                      }
                      _calculateEqualSplits();
                    }
                  });
                },
              ),
            ),
            const SizedBox(height: 20),

            if (!_isPersonal) ...[
              // Split Method Selector
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Split Between Members',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  DropdownButton<String>(
                    value: _splitMethod == 'personal' ? 'equal' : _splitMethod,
                    underline: const SizedBox(),
                    items: const [
                      DropdownMenuItem(value: 'equal', child: Text('Equally')),
                      DropdownMenuItem(value: 'custom', child: Text('Custom Amount')),
                      DropdownMenuItem(value: 'percentage', child: Text('By Percentage')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _splitMethod = val;
                          if (val == 'equal') {
                            _calculateEqualSplits();
                          }
                        });
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Members selection & shares
              Card(
                margin: EdgeInsets.zero,
                child: Column(
                  children: members.map((member) {
                    final isIncluded = _selectedMemberIds.contains(member.id);
                    if (!_customControllers.containsKey(member.id)) {
                      _customControllers[member.id] = TextEditingController();
                    }

                    return CheckboxListTile(
                      value: isIncluded,
                      title: Text(member.isCurrentUser ? '${member.name} (You)' : member.name),
                      secondary: Text(
                        isIncluded
                            ? _splitMethod == 'percentage'
                                ? '% ${_customControllers[member.id]?.text ?? '0'}'
                                : '$currency ${_customControllers[member.id]?.text ?? '0'}'
                            : 'Excluded',
                        style: TextStyle(
                          color: isIncluded ? AppColors.primary : Colors.grey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: isIncluded && _splitMethod != 'equal'
                          ? TextFormField(
                              controller: _customControllers[member.id],
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: InputDecoration(
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                hintText: _splitMethod == 'percentage' ? 'Percentage %' : 'Amount in $currency',
                              ),
                            )
                          : null,
                      onChanged: (checked) {
                        setState(() {
                          if (checked == true) {
                            _selectedMemberIds.add(member.id);
                          } else {
                            _selectedMemberIds.remove(member.id);
                          }
                          if (_splitMethod == 'equal') {
                            _calculateEqualSplits();
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Notes
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                hintText: 'Add details, brands, or shop name',
                prefixIcon: Icon(Icons.notes_rounded),
              ),
            ),
            const SizedBox(height: 20),

            // Receipt Image
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _receiptImagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_receiptImagePath!),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.receipt_rounded),
                        ),
                      )
                    : const Icon(Icons.camera_alt_outlined, color: AppColors.primary),
              ),
              title: Text(_receiptImagePath != null ? 'Receipt Attached' : 'Attach Receipt Image'),
              subtitle: Text(_receiptImagePath != null ? 'Stored locally on your device' : 'Optional bill/photo'),
              trailing: IconButton(
                icon: Icon(_receiptImagePath != null ? Icons.delete_outline_rounded : Icons.add_photo_alternate_rounded),
                onPressed: () {
                  if (_receiptImagePath != null) {
                    setState(() => _receiptImagePath = null);
                  } else {
                    _pickReceiptImage();
                  }
                },
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
