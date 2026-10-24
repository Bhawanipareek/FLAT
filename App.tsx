import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Colors } from './src/theme/colors';
import { AppProvider, useApp } from './src/context/AppContext';
import { FloatingNavBar, MainTab } from './src/components/FloatingNavBar';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';
import { UdharScreen } from './src/screens/UdharScreen';
import { MoreScreen } from './src/screens/MoreScreen';

// Sub-Screens
import { AttendanceSalaryScreen } from './src/screens/AttendanceSalaryScreen';
import { RentBillsScreen } from './src/screens/RentBillsScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { EmiScreen } from './src/screens/EmiScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { BackupRestoreScreen } from './src/screens/BackupRestoreScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Modals
import { AddExpenseModal } from './src/components/modals/AddExpenseModal';
import { AddIncomeModal } from './src/components/modals/AddIncomeModal';
import { TransferModal } from './src/components/modals/TransferModal';
import { AddUdharModal } from './src/components/modals/AddUdharModal';
import { RepayUdharModal } from './src/components/modals/RepayUdharModal';
import { AddVehicleModal } from './src/components/modals/AddVehicleModal';
import { LogFuelModal } from './src/components/modals/LogFuelModal';
import { LogServiceModal } from './src/components/modals/LogServiceModal';
import { AddBillModal } from './src/components/modals/AddBillModal';
import { PayBillModal } from './src/components/modals/PayBillModal';
import { AddEmiModal } from './src/components/modals/AddEmiModal';
import { PayEmiModal } from './src/components/modals/PayEmiModal';
import { AddAccountModal } from './src/components/modals/AddAccountModal';

import { UdharDirection, UdharRecord, Bill, EmiPlan } from './src/types/database';

function MainApp() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);

  // Modal States
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expensePresetTitle, setExpensePresetTitle] = useState<string | undefined>();
  const [expensePresetCat, setExpensePresetCat] = useState<string | undefined>();

  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFromAcc, setTransferFromAcc] = useState<string | undefined>();

  const [showAddUdhar, setShowAddUdhar] = useState(false);
  const [udharDirection, setUdharDirection] = useState<UdharDirection>('GAVE');
  const [repayUdharRecord, setRepayUdharRecord] = useState<UdharRecord | null>(null);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [logFuelVehicleId, setLogFuelVehicleId] = useState<string | null>(null);
  const [logServiceVehicleId, setLogServiceVehicleId] = useState<string | null>(null);

  const [showAddBill, setShowAddBill] = useState(false);
  const [payBillTarget, setPayBillTarget] = useState<Bill | null>(null);

  const [showAddEmi, setShowAddEmi] = useState(false);
  const [payEmiTarget, setPayEmiTarget] = useState<EmiPlan | null>(null);

  const [showAddAccount, setShowAddAccount] = useState(false);

  // Handles quick action triggers from Home
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'income':
        setShowAddIncome(true);
        break;
      case 'expense':
        setExpensePresetTitle(undefined);
        setExpensePresetCat(undefined);
        setShowAddExpense(true);
        break;
      case 'transfer':
        setTransferFromAcc(undefined);
        setShowTransfer(true);
        break;
      case 'udhar':
        setUdharDirection('GAVE');
        setShowAddUdhar(true);
        break;
      case 'vehicle':
        setActiveTab('vehicles');
        break;
      case 'bill':
        setActiveSubScreen('bills');
        break;
      case 'emi':
        setActiveSubScreen('emi');
        break;
      case 'attendance':
        setActiveSubScreen('attendance');
        break;
    }
  };

  const handleOpenAddExpense = (presetTitle?: string, presetCategory?: string) => {
    setExpensePresetTitle(presetTitle);
    setExpensePresetCat(presetCategory);
    setShowAddExpense(true);
  };

  const handleOpenAddUdhar = (dir: UdharDirection) => {
    setUdharDirection(dir);
    setShowAddUdhar(true);
  };

  const renderActiveScreen = () => {
    // If a subscreen from 'More' is active
    if (activeSubScreen) {
      switch (activeSubScreen) {
        case 'attendance':
          return <AttendanceSalaryScreen onBack={() => setActiveSubScreen(null)} />;
        case 'bills':
          return (
            <RentBillsScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenAddBill={() => setShowAddBill(true)}
              onPayBill={(b) => setPayBillTarget(b)}
            />
          );
        case 'accounts':
          return (
            <AccountsScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenAddAccount={() => setShowAddAccount(true)}
              onOpenTransfer={(from) => {
                setTransferFromAcc(from);
                setShowTransfer(true);
              }}
            />
          );
        case 'emi':
          return (
            <EmiScreen
              onBack={() => setActiveSubScreen(null)}
              onOpenAddEmi={() => setShowAddEmi(true)}
              onPayEmi={(e) => setPayEmiTarget(e)}
            />
          );
        case 'reports':
          return <ReportsScreen onBack={() => setActiveSubScreen(null)} />;
        case 'backup':
          return <BackupRestoreScreen onBack={() => setActiveSubScreen(null)} />;
        case 'settings':
          return <SettingsScreen onBack={() => setActiveSubScreen(null)} />;
      }
    }

    // Main 5 Tabs
    switch (activeTab) {
      case 'expenses':
        return <ExpensesScreen onOpenAddExpense={handleOpenAddExpense} />;
      case 'vehicles':
        return (
          <VehiclesScreen
            onOpenAddVehicle={() => setShowAddVehicle(true)}
            onOpenLogFuel={(vId) => setLogFuelVehicleId(vId)}
            onOpenLogService={(vId) => setLogServiceVehicleId(vId)}
          />
        );
      case 'udhar':
        return (
          <UdharScreen
            onOpenAddUdhar={handleOpenAddUdhar}
            onOpenRecordRepayment={(rec) => setRepayUdharRecord(rec)}
          />
        );
      case 'more':
        return <MoreScreen onNavigateTo={(sub) => setActiveSubScreen(sub)} />;
      case 'home':
      default:
        return (
          <HomeScreen
            onOpenQuickAction={handleQuickAction}
            onOpenProfile={() => setActiveSubScreen('settings')}
            onViewAllExpenses={() => setActiveTab('expenses')}
            onViewAllVehicles={() => setActiveTab('vehicles')}
            onViewAllUdhar={() => setActiveTab('udhar')}
            onViewMore={() => setActiveTab('more')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ExpoStatusBar style="light" />

      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Floating Bottom Nav Bar (hidden when in a deep subscreen) */}
      {!activeSubScreen && (
        <FloatingNavBar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveSubScreen(null);
            setActiveTab(tab);
          }}
        />
      )}

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        presetTitle={expensePresetTitle}
        presetCategoryId={expensePresetCat}
      />

      <AddIncomeModal visible={showAddIncome} onClose={() => setShowAddIncome(false)} />

      <TransferModal
        visible={showTransfer}
        onClose={() => setShowTransfer(false)}
        presetFromAccountId={transferFromAcc}
      />

      <AddUdharModal
        visible={showAddUdhar}
        onClose={() => setShowAddUdhar(false)}
        presetDirection={udharDirection}
      />

      <RepayUdharModal
        visible={!!repayUdharRecord}
        onClose={() => setRepayUdharRecord(null)}
        record={repayUdharRecord}
      />

      <AddVehicleModal
        visible={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onVehicleCreated={() => {}}
      />

      <LogFuelModal
        visible={!!logFuelVehicleId}
        onClose={() => setLogFuelVehicleId(null)}
        vehicleId={logFuelVehicleId || ''}
        onLogged={() => {}}
      />

      <LogServiceModal
        visible={!!logServiceVehicleId}
        onClose={() => setLogServiceVehicleId(null)}
        vehicleId={logServiceVehicleId || ''}
        onLogged={() => {}}
      />

      <AddBillModal
        visible={showAddBill}
        onClose={() => setShowAddBill(false)}
        onBillCreated={() => {}}
      />

      <PayBillModal
        visible={!!payBillTarget}
        onClose={() => setPayBillTarget(null)}
        bill={payBillTarget}
        onPaid={() => {}}
      />

      <AddEmiModal
        visible={showAddEmi}
        onClose={() => setShowAddEmi(false)}
        onEmiCreated={() => {}}
      />

      <PayEmiModal
        visible={!!payEmiTarget}
        onClose={() => setPayEmiTarget(null)}
        emi={payEmiTarget}
        onPaid={() => {}}
      />

      <AddAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAccountCreated={() => {}}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContainer: {
    flex: 1,
  },
});
