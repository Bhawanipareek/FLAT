import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../data/models/shopping_item_model.dart';
import '../../../providers/app_state_provider.dart';
import '../../../providers/shopping_provider.dart';

class ConvertToExpenseDialog extends StatefulWidget {
  final ShoppingItemModel item;

  const ConvertToExpenseDialog({super.key, required this.item});

  @override
  State<ConvertToExpenseDialog> createState() => _ConvertToExpenseDialogState();
}

class _ConvertToExpenseDialogState extends State<ConvertToExpenseDialog> {
  late TextEditingController _priceController;
  late TextEditingController _notesController;
  String? _selectedPayerId;
  final Set<String> _selectedSplitMembers = {};
  bool _isConverting = false;

  @override
  void initState() {
    super.initState();
    _priceController = TextEditingController(
      text: widget.item.estimatedPrice > 0
          ? widget.item.estimatedPrice.toStringAsFixed(2)
          : '',
    );
    _notesController = TextEditingController(
      text: 'Purchased shopping item: ${widget.item.name}',
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppStateProvider>();
      setState(() {
        _selectedPayerId = widget.item.assignedMemberId ??
            appState.currentUserMember?.id ??
            (appState.members.isNotEmpty ? appState.members.first.id : null);

        for (final m in appState.members) {
          _selectedSplitMembers.add(m.id);
        }
      });
    });
  }

  @override
  void dispose() {
    _priceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final shoppingProv = context.watch<ShoppingProvider>();
    final currency = appState.activeGroup?.currency ?? '₹';

    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.success),
          const SizedBox(width: 8),
          const Text('Item Purchased!'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Convert "${widget.item.name}" into a shared flat expense.',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryLight),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _priceController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                labelText: 'Actual Price Paid ($currency)',
                prefixText: '$currency ',
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedPayerId,
              decoration: const InputDecoration(
                labelText: 'Who Paid for it?',
              ),
              items: appState.members.map((m) {
                return DropdownMenuItem(
                  value: m.id,
                  child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _selectedPayerId = val);
              },
            ),
            const SizedBox(height: 16),
            const Text(
              'Split Equally Among:',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            ...appState.members.map((m) {
              final isChecked = _selectedSplitMembers.contains(m.id);
              return CheckboxListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                value: isChecked,
                title: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                onChanged: (checked) {
                  setState(() {
                    if (checked == true) {
                      _selectedSplitMembers.add(m.id);
                    } else {
                      _selectedSplitMembers.remove(m.id);
                    }
                  });
                },
              );
            }),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isConverting
              ? null
              : () async {
                  final price = double.tryParse(_priceController.text);
                  if (price == null || price <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please enter valid purchase amount')),
                    );
                    return;
                  }
                  if (_selectedPayerId == null || _selectedSplitMembers.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Select payer and at least one member to split')),
                    );
                    return;
                  }

                  setState(() => _isConverting = true);
                  await shoppingProv.convertItemToExpense(
                    item: widget.item,
                    actualPrice: price,
                    payerMemberId: _selectedPayerId!,
                    splitMemberIds: _selectedSplitMembers.toList(),
                    notes: _notesController.text.trim(),
                  );

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Converted "${widget.item.name}" to expense of $currency $price'),
                      ),
                    );
                  }
                },
          child: _isConverting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Confirm & Split'),
        ),
      ],
    );
  }
}
