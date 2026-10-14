import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../providers/app_state_provider.dart';
import 'qr_share_screen.dart';

class CreateGroupScreen extends StatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  State<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends State<CreateGroupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _groupNameController = TextEditingController(text: 'My Flat');
  final _userNameController = TextEditingController();
  final _userPhoneController = TextEditingController();

  String _selectedCurrency = '₹';
  String _selectedCurrencyCode = 'INR';
  bool _isCreating = false;

  final List<Map<String, String>> _currencies = [
    {'symbol': '₹', 'code': 'INR', 'label': 'Indian Rupee (₹)'},
    {'symbol': '\$', 'code': 'USD', 'label': 'US Dollar (\$)'},
    {'symbol': '€', 'code': 'EUR', 'label': 'Euro (€)'},
    {'symbol': '£', 'code': 'GBP', 'label': 'British Pound (£)'},
    {'symbol': 'AED', 'code': 'AED', 'label': 'UAE Dirham (AED)'},
  ];

  @override
  void initState() {
    super.initState();
    final appState = context.read<AppStateProvider>();
    _userNameController.text = appState.currentUserName ?? 'Roommate 1';
  }

  @override
  void dispose() {
    _groupNameController.dispose();
    _userNameController.dispose();
    _userPhoneController.dispose();
    super.dispose();
  }

  Future<void> _handleCreateGroup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isCreating = true);
    final appState = context.read<AppStateProvider>();

    try {
      await appState.updateProfile(
        _userNameController.text.trim(),
        phone: _userPhoneController.text.trim().isEmpty ? null : _userPhoneController.text.trim(),
      );

      final group = await appState.createGroup(
        name: _groupNameController.text.trim(),
        currency: _selectedCurrency,
        currencyCode: _selectedCurrencyCode,
      );

      if (mounted) {
        Navigator.pop(context); // close create screen
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => QrShareScreen(group: group)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create group: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Flat Group'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer.withOpacity(0.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.wifi_rounded, color: AppColors.primary, size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'All flat data will be stored 100% locally on your phone. Flatmates can sync over Wi-Fi without cloud servers.',
                      style: TextStyle(fontSize: 13, color: AppColors.onPrimaryContainer),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _groupNameController,
              decoration: const InputDecoration(
                labelText: 'Flat / Group Name',
                hintText: 'e.g. Flat 402, Green Residency, Hostel B',
                prefixIcon: Icon(Icons.apartment_rounded),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Enter group name' : null,
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              value: _selectedCurrency,
              decoration: const InputDecoration(
                labelText: 'Currency',
                prefixIcon: Icon(Icons.currency_exchange_rounded),
              ),
              items: _currencies.map((c) {
                return DropdownMenuItem(
                  value: c['symbol']!,
                  child: Text(c['label']!),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  final item = _currencies.firstWhere((c) => c['symbol'] == val);
                  setState(() {
                    _selectedCurrency = val;
                    _selectedCurrencyCode = item['code']!;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            const Text(
              'Your Profile Details',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _userNameController,
              decoration: const InputDecoration(
                labelText: 'Your Name',
                hintText: 'Enter your name as flatmates know you',
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Enter your name' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _userPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone Number (Optional)',
                hintText: 'For easy contact matching',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 36),
            ElevatedButton(
              onPressed: _isCreating ? null : _handleCreateGroup,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isCreating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Create Group & Show QR Code'),
            ),
          ],
        ),
      ),
    );
  }
}
