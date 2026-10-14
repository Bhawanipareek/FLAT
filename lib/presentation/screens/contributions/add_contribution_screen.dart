import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/contributions_provider.dart';

class AddContributionScreen extends StatefulWidget {
  const AddContributionScreen({super.key});

  @override
  State<AddContributionScreen> createState() => _AddContributionScreenState();
}

class _AddContributionScreenState extends State<AddContributionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController(text: 'Monthly Flat Fund');
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();

  String? _payerMemberId;
  String? _receiverMemberId;
  String _selectedType = 'flat_fund';
  DateTime _selectedDate = DateTime.now();
  bool _isSaving = false;

  final List<Map<String, String>> _types = [
    {'id': 'flat_fund', 'name': 'Flat Shared Fund'},
    {'id': 'rent_contribution', 'name': 'Rent Contribution / Advance'},
    {'id': 'refund', 'name': 'Refund / Store Return'},
    {'id': 'other', 'name': 'Other Money Received'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppStateProvider>();
      setState(() {
        _payerMemberId = appState.currentUserMember?.id ??
            (appState.members.isNotEmpty ? appState.members.first.id : null);
      });
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _payerMemberId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid amount and select payer')),
      );
      return;
    }

    setState(() => _isSaving = true);
    final appState = context.read<AppStateProvider>();
    final contribProv = context.read<ContributionsProvider>();

    try {
      await contribProv.saveContribution(
        groupId: appState.activeGroup!.id,
        title: _titleController.text.trim(),
        amount: amount,
        date: _selectedDate,
        payerMemberId: _payerMemberId!,
        receiverMemberId: _receiverMemberId,
        type: _selectedType,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to record contribution: $e')),
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
        title: const Text('Add Money In'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _submit,
            child: _isSaving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
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
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title / Description',
                hintText: 'e.g. October Flat Fund, Diwali Bonus, Room deposit',
                prefixIcon: Icon(Icons.description_outlined),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Enter a title' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                labelText: 'Amount Received ($currency)',
                prefixText: '$currency ',
                prefixStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Enter amount';
                final val = double.tryParse(v);
                if (val == null || val <= 0) return 'Enter valid amount > 0';
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _payerMemberId,
              decoration: const InputDecoration(
                labelText: 'Contributed By',
                prefixIcon: Icon(Icons.person_outline),
              ),
              items: appState.members.map((m) {
                return DropdownMenuItem(
                  value: m.id,
                  child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                );
              }).toList(),
              onChanged: (val) => setState(() => _payerMemberId = val),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _receiverMemberId,
              decoration: const InputDecoration(
                labelText: 'Received By (Optional)',
                prefixIcon: Icon(Icons.account_balance_wallet_outlined),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Shared Flat Account / Cash Box')),
                ...appState.members.map((m) {
                  return DropdownMenuItem(
                    value: m.id,
                    child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                  );
                }),
              ],
              onChanged: (val) => setState(() => _receiverMemberId = val),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: 'Contribution Type',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: _types.map((t) {
                return DropdownMenuItem(value: t['id']!, child: Text(t['name']!));
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _selectedType = val);
              },
            ),
            const SizedBox(height: 16),
            InkWell(
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
                  labelText: 'Receipt Date',
                  prefixIcon: Icon(Icons.calendar_today_rounded),
                ),
                child: Text(DateFormat('dd MMM yyyy').format(_selectedDate)),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                hintText: 'e.g. Paid via PhonePe reference ID 12345',
                prefixIcon: Icon(Icons.notes_rounded),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
