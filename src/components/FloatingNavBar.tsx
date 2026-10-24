import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export type MainTab = 'expenses' | 'vehicles' | 'home' | 'udhar' | 'more';

interface FloatingNavBarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        {/* Top inner glass line */}
        <View style={styles.highlightLine} />

        {/* Expenses Tab */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('expenses')}
          style={styles.tabItem}
        >
          <Feather
            name="arrow-down-right"
            size={20}
            color={currentTab === 'expenses' ? Colors.white : Colors.inactiveTab}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'expenses' && styles.activeTabLabel,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>

        {/* Vehicles Tab */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('vehicles')}
          style={styles.tabItem}
        >
          <Feather
            name="navigation"
            size={20}
            color={currentTab === 'vehicles' ? Colors.white : Colors.inactiveTab}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'vehicles' && styles.activeTabLabel,
            ]}
          >
            Vehicles
          </Text>
        </TouchableOpacity>

        {/* Home Tab - Raised in Center */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelectTab('home')}
          style={styles.centerHomeWrapper}
        >
          <View
            style={[
              styles.centerHomeButton,
              currentTab === 'home' ? styles.centerHomeActive : styles.centerHomeInactive,
            ]}
          >
            <Feather
              name="home"
              size={24}
              color={currentTab === 'home' ? Colors.black : Colors.white}
            />
          </View>
        </TouchableOpacity>

        {/* Udhar Tab */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('udhar')}
          style={styles.tabItem}
        >
          <Feather
            name="users"
            size={20}
            color={currentTab === 'udhar' ? Colors.white : Colors.inactiveTab}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'udhar' && styles.activeTabLabel,
            ]}
          >
            Udhar
          </Text>
        </TouchableOpacity>

        {/* More Tab */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('more')}
          style={styles.tabItem}
        >
          <Feather
            name="grid"
            size={20}
            color={currentTab === 'more' ? Colors.white : Colors.inactiveTab}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'more' && styles.activeTabLabel,
            ]}
          >
            More
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20, 20, 20, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
    position: 'relative',
    overflow: 'visible',
  },
  highlightLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.inactiveTab,
  },
  activeTabLabel: {
    color: Colors.white,
    fontWeight: '700',
  },
  centerHomeWrapper: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHomeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  centerHomeActive: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  centerHomeInactive: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.glassBorderStrong,
  },
});
