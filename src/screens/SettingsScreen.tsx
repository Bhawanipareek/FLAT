import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { useApp } from '../context/AppContext';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { userName, updateUserName, hideBalances, toggleHideBalances } = useApp();
  const [nameInput, setNameInput] = useState(userName);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    updateUserName(nameInput.trim());
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Not Supported', 'Biometric sensor not found on this device.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not Enrolled', 'No fingerprints or facial data enrolled on this phone.');
        return;
      }
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric app lock',
        fallbackLabel: 'Use Device PIN',
      });
      if (auth.success) {
        setBiometricEnabled(true);
        Alert.alert('Protected', 'Biometric App Lock enabled.');
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Nav */}
        <View style={styles.topNav}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Profile & Settings</Text>
            <Text style={styles.pageSubtitle}>Preferences, Security & Privacy</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          <GlassCard style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarLarge}>
                <Feather name="user" size={24} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarTitle}>{userName}</Text>
                <Text style={styles.avatarSubtitle}>Local Offline Account</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <GlassButton
              title="Save Profile"
              onPress={handleSaveProfile}
              style={{ marginTop: 6 }}
            />
          </GlassCard>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <GlassCard style={styles.card}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Hide Balances by Default</Text>
                <Text style={styles.settingDesc}>
                  Masks financial amounts on screen with dots for privacy in public.
                </Text>
              </View>
              <Switch
                value={hideBalances}
                onValueChange={toggleHideBalances}
                thumbColor={hideBalances ? Colors.white : Colors.textMuted}
                trackColor={{ false: Colors.surfaceSecondary, true: Colors.success }}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Biometric App Lock</Text>
                <Text style={styles.settingDesc}>
                  Require fingerprint or FaceID authentication before opening Hisab OS.
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometrics}
                thumbColor={biometricEnabled ? Colors.white : Colors.textMuted}
                trackColor={{ false: Colors.surfaceSecondary, true: Colors.success }}
              />
            </View>
          </GlassCard>
        </View>

        {/* About Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Hisab OS</Text>
          <GlassCard style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Product</Text>
              <Text style={styles.aboutVal}>Hisab OS (v1.0.0)</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Storage</Text>
              <Text style={styles.aboutVal}>100% Local SQLite</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Architecture</Text>
              <Text style={styles.aboutVal}>Zero Cloud / Offline Standalone</Text>
            </View>
            <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.aboutKey}>Currency</Text>
              <Text style={styles.aboutVal}>Indian Rupee (₹)</Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  pageSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  card: {
    padding: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.2,
    borderColor: Colors.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  avatarSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: Colors.white,
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    gap: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  aboutKey: {
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  aboutVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.white,
  },
});
