import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/salary_provider.dart';

class SalaryAttendanceScreen extends StatefulWidget {
  const SalaryAttendanceScreen({super.key});

  @override
  State<SalaryAttendanceScreen> createState() => _SalaryAttendanceScreenState();
}

class _SalaryAttendanceScreenState extends State<SalaryAttendanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SalaryProvider>().loadData();
    });
  }

  void _showSalarySettingsDialog(BuildContext context) {
    final prov = context.read<SalaryProvider>();
    final profile = prov.profile;

    final grossController = TextEditingController(
      text: profile.grossSalary > 0 ? profile.grossSalary.toStringAsFixed(0) : '',
    );
    final deductionsController = TextEditingController(
      text: profile.fixedDeductions > 0 ? profile.fixedDeductions.toStringAsFixed(0) : '0',
    );
    final leavesController = TextEditingController(
      text: profile.monthlyPaidLeaves.toString(),
    );
    int workDays = profile.workDaysPerWeek;
    bool sandwich = profile.sandwichRuleEnabled;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Salary & Office Settings',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: grossController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Monthly Gross Salary / Kul Salary (₹)',
                        hintText: 'e.g. 45000',
                        prefixIcon: Icon(Icons.currency_rupee_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: deductionsController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Monthly Fixed Deductions (PF / Tax / ESI) (₹)',
                        hintText: 'e.g. 1800',
                        prefixIcon: Icon(Icons.remove_circle_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: leavesController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Monthly Paid Leaves Allowed (Chuttiya)',
                        hintText: 'e.g. 1.5 or 2',
                        prefixIcon: Icon(Icons.beach_access_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Working Days Per Week', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    SegmentedButton<int>(
                      segments: const [
                        ButtonSegment(value: 5, label: Text('5 Days (Mon-Fri)')),
                        ButtonSegment(value: 6, label: Text('6 Days (Mon-Sat)')),
                      ],
                      selected: {workDays},
                      onSelectionChanged: (set) {
                        setModalState(() => workDays = set.first);
                      },
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Sandwich Leave Rule',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Agar Friday aur Monday chutti li, to beech ka weekend (Sat/Sun) bhi chutti count hoga aur salary kategi.',
                        style: TextStyle(fontSize: 12),
                      ),
                      value: sandwich,
                      onChanged: (val) {
                        setModalState(() => sandwich = val);
                      },
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      onPressed: () async {
                        final gross = double.tryParse(grossController.text) ?? 0.0;
                        final ded = double.tryParse(deductionsController.text) ?? 0.0;
                        final pl = double.tryParse(leavesController.text) ?? 1.5;

                        await prov.updateSalaryProfile(
                          grossSalary: gross,
                          fixedDeductions: ded,
                          monthlyPaidLeaves: pl,
                          workDaysPerWeek: workDays,
                          sandwichRuleEnabled: sandwich,
                          deductionBasis: 'calendar_days',
                        );

                        if (context.mounted) Navigator.pop(context);
                      },
                      child: const Text('Save Salary Settings'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showMarkDayDialog(BuildContext context, int day) {
    final prov = context.read<SalaryProvider>();
    final date = DateTime(prov.selectedMonth.year, prov.selectedMonth.month, day);
    final currentStatus = prov.getEffectiveStatusForDay(day);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mark Attendance for ${DateFormat('dd MMMM yyyy (EEEE)').format(date)}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.check_circle_rounded, color: AppColors.success),
                title: const Text('Full Day (Poora Din Gaya)'),
                trailing: currentStatus == 'full_day' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'full_day');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.access_time_filled_rounded, color: AppColors.warning),
                title: const Text('Half Day (Aadha Din - 0.5 Day Cut)'),
                trailing: currentStatus == 'half_day' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'half_day');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.beach_access_rounded, color: Colors.blue),
                title: const Text('Paid Leave (Approved Chutti / CL)'),
                trailing: currentStatus == 'paid_leave' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'paid_leave');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.cancel_rounded, color: AppColors.error),
                title: const Text('Unpaid Leave / Absent (Bina Pay Chutti / LWP)'),
                trailing: currentStatus == 'unpaid_leave' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'unpaid_leave');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.celebration_rounded, color: Colors.purple),
                title: const Text('Holiday / Gazetted Holiday'),
                trailing: currentStatus == 'holiday' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'holiday');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.weekend_rounded, color: Colors.grey),
                title: const Text('Weekly Off (Weekend)'),
                trailing: currentStatus == 'weekly_off' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  prov.markAttendance(date: date, status: 'weekly_off');
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<SalaryProvider>();
    final calc = prov.calculationResult;
    final currency = context.watch<AppStateProvider>().activeGroup?.currency ?? '₹';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Salary & Haziri'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Salary Settings',
            onPressed: () => _showSalarySettingsDialog(context),
          ),
        ],
      ),
      body: prov.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: 32),
              children: [
                // Month Selector
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left_rounded),
                        onPressed: () {
                          final prevMonth = DateTime(
                            prov.selectedMonth.year,
                            prov.selectedMonth.month - 1,
                          );
                          prov.setSelectedMonth(prevMonth);
                        },
                      ),
                      Text(
                        DateFormat('MMMM yyyy').format(prov.selectedMonth),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right_rounded),
                        onPressed: () {
                          final nextMonth = DateTime(
                            prov.selectedMonth.year,
                            prov.selectedMonth.month + 1,
                          );
                          prov.setSelectedMonth(nextMonth);
                        },
                      ),
                    ],
                  ),
                ),

                // Primary In-Hand Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF047857), Color(0xFF10B981)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.3),
                        offset: const Offset(0, 8),
                        blurRadius: 16,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Estimated In-Hand Salary (Haath Me)',
                            style: TextStyle(
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          InkWell(
                            onTap: () => _showSalarySettingsDialog(context),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.edit_rounded, color: Colors.white, size: 12),
                                  SizedBox(width: 4),
                                  Text(
                                    'Edit CTC',
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        calc != null
                            ? CurrencyFormatter.format(calc.netInHandSalary, symbol: currency)
                            : '$currency 0',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const Divider(color: Colors.white24, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _SalaryMetric(
                            label: 'Kul Salary',
                            value: calc != null ? CurrencyFormatter.format(calc.grossSalary, symbol: currency) : '₹0',
                            textColor: Colors.white,
                          ),
                          _SalaryMetric(
                            label: 'Chutti Ka Kata',
                            value: calc != null
                                ? '-${CurrencyFormatter.format(calc.leaveDeductionAmount, symbol: currency)}'
                                : '₹0',
                            textColor: Colors.yellowAccent,
                          ),
                          _SalaryMetric(
                            label: 'PF/Tax',
                            value: calc != null
                                ? '-${CurrencyFormatter.format(calc.fixedDeductions, symbol: currency)}'
                                : '₹0',
                            textColor: Colors.white70,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Attendance Status Summary
                if (calc != null)
                  Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Attendance & Leaves Summary (Haziri)',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _HaziriChip(
                                label: 'Present',
                                count: '${calc.presentDays} days',
                                color: AppColors.success,
                              ),
                              _HaziriChip(
                                label: 'Half Days',
                                count: '${calc.halfDaysCount}',
                                color: AppColors.warning,
                              ),
                              _HaziriChip(
                                label: 'Leaves Taken',
                                count: '${calc.leavesTakenCount}',
                                color: AppColors.error,
                              ),
                              _HaziriChip(
                                label: 'Paid Quota',
                                count: '${calc.paidLeavesAllowed}',
                                color: Colors.blue,
                              ),
                            ],
                          ),
                          if (calc.sandwichDaysCount > 0) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Sandwich Rule Applied: ${calc.sandwichDaysCount} weekend day(s) deducted as unpaid leave!',
                                      style: TextStyle(
                                        color: Colors.red.shade900,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                // Quick Action: Today's Attendance
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Mark Today: Full Day Ya Half Day?',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                              label: const Text('Full Day', style: TextStyle(fontSize: 12)),
                              onPressed: () {
                                prov.markAttendance(date: DateTime.now(), status: 'full_day');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Today marked as Full Day Present')),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.access_time_filled_rounded, color: AppColors.warning, size: 16),
                              label: const Text('Half Day', style: TextStyle(fontSize: 12)),
                              onPressed: () {
                                prov.markAttendance(date: DateTime.now(), status: 'half_day');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Today marked as Half Day (0.5 Cut)')),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.cancel_rounded, color: AppColors.error, size: 16),
                              label: const Text('Leave', style: TextStyle(fontSize: 12)),
                              onPressed: () {
                                prov.markAttendance(date: DateTime.now(), status: 'unpaid_leave');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Today marked as Leave')),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Calendar Days List
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Monthly Attendance Calendar (Tap to change)',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        '${calc?.daysInMonth ?? 30} Days',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),

                if (calc != null)
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: calc.daysInMonth,
                    itemBuilder: (context, index) {
                      final day = index + 1;
                      final date = DateTime(prov.selectedMonth.year, prov.selectedMonth.month, day);
                      final status = prov.getEffectiveStatusForDay(day);
                      final isSandwich = calc.sandwichDates.any((d) => d.day == day);

                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 3),
                        child: ListTile(
                          dense: true,
                          leading: CircleAvatar(
                            radius: 16,
                            backgroundColor: _getStatusColor(status, isSandwich).withOpacity(0.15),
                            child: Text(
                              '$day',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: _getStatusColor(status, isSandwich),
                              ),
                            ),
                          ),
                          title: Text(
                            DateFormat('dd MMM (EEEE)').format(date),
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          subtitle: Text(
                            isSandwich
                                ? 'Sandwich Leave (Salary Cut)'
                                : _getStatusLabel(status),
                            style: TextStyle(
                              fontSize: 11,
                              color: isSandwich ? AppColors.error : Colors.grey.shade600,
                              fontWeight: isSandwich ? FontWeight.w700 : FontWeight.normal,
                            ),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getStatusColor(status, isSandwich).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isSandwich ? 'Sandwich' : _getStatusBadgeText(status),
                              style: TextStyle(
                                color: _getStatusColor(status, isSandwich),
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          onTap: () => _showMarkDayDialog(context, day),
                        ),
                      );
                    },
                  ),
              ],
            ),
    );
  }

  Color _getStatusColor(String status, bool isSandwich) {
    if (isSandwich) return AppColors.error;
    switch (status) {
      case 'full_day':
        return AppColors.success;
      case 'half_day':
        return AppColors.warning;
      case 'paid_leave':
        return Colors.blue;
      case 'unpaid_leave':
        return AppColors.error;
      case 'holiday':
        return Colors.purple;
      case 'weekly_off':
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'full_day':
        return 'Full Day (Office Present)';
      case 'half_day':
        return 'Half Day (0.5 Day Cut)';
      case 'paid_leave':
        return 'Paid Leave (CL/SL)';
      case 'unpaid_leave':
        return 'Unpaid Leave (Absent)';
      case 'holiday':
        return 'Public / Gazetted Holiday';
      case 'weekly_off':
      default:
        return 'Weekly Off / Weekend';
    }
  }

  String _getStatusBadgeText(String status) {
    switch (status) {
      case 'full_day':
        return 'Present';
      case 'half_day':
        return 'Half Day';
      case 'paid_leave':
        return 'Paid Leave';
      case 'unpaid_leave':
        return 'Absent';
      case 'holiday':
        return 'Holiday';
      case 'weekly_off':
      default:
        return 'Off';
    }
  }
}

class _SalaryMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color textColor;

  const _SalaryMetric({
    required this.label,
    required this.value,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textColor),
        ),
      ],
    );
  }
}

class _HaziriChip extends StatelessWidget {
  final String label;
  final String count;
  final Color color;

  const _HaziriChip({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          count,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }
}
