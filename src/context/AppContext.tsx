import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, UserProfile } from '../types/database';
import { getAllAccounts, getCashBalance, getBankBalance, getTotalAvailableBalance } from '../db/queries/accounts';
import { getCurrentMonthPeriod } from '../utils/date';
import { getDatabase, initDatabase } from '../db/database';

interface AppContextType {
  accounts: Account[];
  cashBalance: number;
  bankBalance: number;
  totalBalance: number;
  hideBalances: boolean;
  toggleHideBalances: () => void;
  userName: string;
  updateUserName: (name: string) => void;
  currentMonth: { start: string; end: string; label: string };
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Bhawani Singh');
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthPeriod());

  const refreshData = useCallback(() => {
    try {
      const accs = getAllAccounts();
      setAccounts(accs);
      setCashBalance(getCashBalance());
      setBankBalance(getBankBalance());
      setTotalBalance(getTotalAvailableBalance());

      const db = getDatabase();
      const hideSetting = db.getFirstSync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'hide_balances';"
      );
      if (hideSetting) {
        setHideBalances(hideSetting.value === 'true');
      }

      const nameSetting = db.getFirstSync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'user_name';"
      );
      if (nameSetting && nameSetting.value) {
        setUserName(nameSetting.value);
      }
    } catch (e) {
      console.error('Error refreshing app state:', e);
    }
  }, []);

  useEffect(() => {
    try {
      initDatabase();
      refreshData();
    } catch (e) {
      console.error('Database initialization error:', e);
    }
  }, [refreshData]);

  const toggleHideBalances = () => {
    const nextVal = !hideBalances;
    setHideBalances(nextVal);
    const db = getDatabase();
    db.runSync(
      "INSERT INTO app_settings (key, value) VALUES ('hide_balances', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
      [nextVal ? 'true' : 'false']
    );
  };

  const updateUserName = (name: string) => {
    setUserName(name);
    const db = getDatabase();
    db.runSync(
      "INSERT INTO app_settings (key, value) VALUES ('user_name', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
      [name]
    );
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        cashBalance,
        bankBalance,
        totalBalance,
        hideBalances,
        toggleHideBalances,
        userName,
        updateUserName,
        currentMonth,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
