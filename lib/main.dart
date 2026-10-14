import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/services/preferences_service.dart';
import 'presentation/providers/app_state_provider.dart';
import 'presentation/providers/contributions_provider.dart';
import 'presentation/providers/expenses_provider.dart';
import 'presentation/providers/settlement_provider.dart';
import 'presentation/providers/shopping_provider.dart';
import 'presentation/screens/main_navigation_screen.dart';
import 'sync/p2p_sync_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefsService = await PreferencesService.create();
  final syncManager = P2pSyncManager(prefs: prefsService);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AppStateProvider(
            prefs: prefsService,
            syncManager: syncManager,
          )..initialize(),
        ),
        ChangeNotifierProvider(
          create: (_) => ExpensesProvider(syncManager: syncManager),
        ),
        ChangeNotifierProvider(
          create: (_) => ShoppingProvider(syncManager: syncManager),
        ),
        ChangeNotifierProvider(
          create: (_) => ContributionsProvider(syncManager: syncManager),
        ),
        ChangeNotifierProvider(
          create: (_) => SettlementProvider(syncManager: syncManager),
        ),
      ],
      child: const FlatExpenseApp(),
    ),
  );
}

class FlatExpenseApp extends StatefulWidget {
  const FlatExpenseApp({super.key});

  @override
  State<FlatExpenseApp> createState() => _FlatExpenseAppState();
}

class _FlatExpenseAppState extends State<FlatExpenseApp> {
  @override
  void initState() {
    super.initState();
    // After initial load, trigger loading for all active group data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadGroupData();
    });
  }

  Future<void> _loadGroupData() async {
    final appState = context.read<AppStateProvider>();
    if (appState.activeGroup != null) {
      final groupId = appState.activeGroup!.id;
      final currentUserId = appState.currentUserId ?? '';
      await context.read<ExpensesProvider>().loadExpenses(groupId);
      await context.read<ShoppingProvider>().loadItems(groupId);
      await context.read<ContributionsProvider>().loadContributions(groupId);
      await context.read<SettlementProvider>().recalculate(groupId, currentUserId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();

    return MaterialApp(
      title: 'Flat Expense Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: appState.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: appState.isLoading
          ? const Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            )
          : const MainNavigationScreen(),
    );
  }
}
