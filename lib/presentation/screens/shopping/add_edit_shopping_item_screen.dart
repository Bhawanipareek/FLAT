import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/shopping_item_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/shopping_provider.dart';

class AddEditShoppingItemScreen extends StatefulWidget {
  final ShoppingItemModel? existingItem;

  const AddEditShoppingItemScreen({super.key, this.existingItem});

  @override
  State<AddEditShoppingItemScreen> createState() => _AddEditShoppingItemScreenState();
}

class _AddEditShoppingItemScreenState extends State<AddEditShoppingItemScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _unitController;
  late TextEditingController _estimatedPriceController;

  String _priority = 'medium';
  String? _assignedMemberId;
  DateTime? _dueDate;
  bool _isSaving = false;

  final List<String> _commonUnits = ['unit', 'kg', 'g', 'litres', 'ml', 'packet', 'dozen', 'can'];

  @override
  void initState() {
    super.initState();
    final item = widget.existingItem;
    _nameController = TextEditingController(text: item?.name ?? '');
    _quantityController = TextEditingController(text: (item?.quantity ?? 1.0).toString());
    _unitController = TextEditingController(text: item?.unit ?? 'kg');
    _estimatedPriceController = TextEditingController(
      text: item != null && item.estimatedPrice > 0 ? item.estimatedPrice.toStringAsFixed(0) : '',
    );
    _priority = item?.priority ?? 'medium';
    _assignedMemberId = item?.assignedMemberId;
    _dueDate = item?.dueDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    _estimatedPriceController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final appState = context.read<AppStateProvider>();
    final shoppingProv = context.read<ShoppingProvider>();

    try {
      await shoppingProv.saveItem(
        groupId: appState.activeGroup!.id,
        existingId: widget.existingItem?.id,
        name: _nameController.text.trim(),
        quantity: double.tryParse(_quantityController.text) ?? 1.0,
        unit: _unitController.text.trim().isEmpty ? 'unit' : _unitController.text.trim(),
        estimatedPrice: double.tryParse(_estimatedPriceController.text) ?? 0.0,
        priority: _priority,
        assignedMemberId: _assignedMemberId,
        dueDate: _dueDate,
        currentUserId: appState.currentUserId!,
      );

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save item: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final currency = appState.activeGroup?.currency ?? '₹';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existingItem == null ? 'Add Shopping Item' : 'Edit Shopping Item'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _submit,
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
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Item Name',
                hintText: 'e.g. Milk, Wheat flour, Potatoes',
                prefixIcon: Icon(Icons.shopping_bag_outlined),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Enter item name' : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _quantityController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Quantity',
                      prefixIcon: Icon(Icons.pin_outlined),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _unitController,
                    decoration: InputDecoration(
                      labelText: 'Unit',
                      hintText: 'kg, litres, etc.',
                      suffixIcon: PopupMenuButton<String>(
                        icon: const Icon(Icons.arrow_drop_down),
                        onSelected: (u) => setState(() => _unitController.text = u),
                        itemBuilder: (_) => _commonUnits
                            .map((u) => PopupMenuItem(value: u, child: Text(u)))
                            .toList(),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _estimatedPriceController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Estimated Price ($currency)',
                hintText: 'Optional estimate',
                prefixText: '$currency ',
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Priority',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Row(
              children: ['low', 'medium', 'high'].map((p) {
                final isSelected = _priority == p;
                Color col;
                if (p == 'high') {
                  col = AppColors.error;
                } else if (p == 'medium') {
                  col = AppColors.warning;
                } else {
                  col = AppColors.info;
                }

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(p.toUpperCase()),
                    selected: isSelected,
                    selectedColor: col,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : null,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _priority = p);
                    },
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              value: _assignedMemberId,
              decoration: const InputDecoration(
                labelText: 'Assign To Flatmate (Optional)',
                prefixIcon: Icon(Icons.person_add_alt_1_outlined),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Anyone can buy')),
                ...appState.members.map((m) {
                  return DropdownMenuItem(
                    value: m.id,
                    child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                  );
                }),
              ],
              onChanged: (val) {
                setState(() => _assignedMemberId = val);
              },
            ),
            const SizedBox(height: 20),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() => _dueDate = picked);
                }
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Due Date (Optional)',
                  prefixIcon: const Icon(Icons.event_outlined),
                  suffixIcon: _dueDate != null
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () => setState(() => _dueDate = null),
                        )
                      : null,
                ),
                child: Text(
                  _dueDate != null ? DateFormat('dd MMM yyyy').format(_dueDate!) : 'No due date',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
