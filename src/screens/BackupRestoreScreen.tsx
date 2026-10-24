import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { exportDatabaseBackup, importDatabaseBackup } from '../db/queries/backup';
import { useApp } from '../context/AppContext';

interface BackupRestoreScreenProps {
  onBack: () => void;
}

export const BackupRestoreScreen: React.FC<BackupRestoreScreenProps> = ({ onBack }) => {
  const { refreshData } = useApp();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setStatusMessage('Generating encrypted offline JSON archive...');
      const path = await exportDatabaseBackup();
      setStatusMessage(`Backup created successfully.`);
      Alert.alert(
        'Backup Exported',
        'Your offline database backup was generated and opened in the system share sheet. Save it to Google Drive, Files, or WhatsApp.'
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Export Failed', e.message || 'Could not export backup');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore From Backup',
      'Restoring will replace all current data with the contents of the chosen backup file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File & Restore',
          onPress: async () => {
            try {
              setLoading(true);
              setStatusMessage('Reading backup and restoring tables...');
              const success = await importDatabaseBackup();
              if (success) {
                refreshData();
                Alert.alert('Restore Complete', 'All records have been restored successfully.');
                setStatusMessage('Data successfully restored.');
              }
            } catch (e: any) {
              console.error(e);
              Alert.alert('Restore Failed', e.message || 'Could not restore backup file.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            <Text style={styles.pageTitle}>Backup & Restore</Text>
            <Text style={styles.pageSubtitle}>100% Offline Local Data Preservation</Text>
          </View>
        </View>

        {/* Offline Security Info Banner */}
        <View style={styles.section}>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoIconRow}>
              <Feather name="shield" size={20} color={Colors.success} />
              <Text style={styles.infoTitle}>Zero Cloud. 100% Private.</Text>
            </View>
            <Text style={styles.infoText}>
              Hisab OS stores all your financial records strictly on your physical device. We have no
              servers or cloud logins. Export regular backups to ensure your data is safe when switching phones.
            </Text>
          </GlassCard>
        </View>

        {/* Export Backup Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Local Archive</Text>
          <GlassCard style={styles.actionCard}>
            <Text style={styles.actionLabel}>Full Database JSON Export</Text>
            <Text style={styles.actionDesc}>
              Includes all accounts, transactions, cash logs, udhar ledgers, EMIs, vehicles, fuel logs, and salary attendance.
            </Text>
            <GlassButton
              title="Export & Save Backup"
              onPress={handleExport}
              disabled={loading}
              icon={<Feather name="download" size={16} color={Colors.black} />}
              style={{ marginTop: 14 }}
            />
          </GlassCard>
        </View>

        {/* Import Backup Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restore Archive</Text>
          <GlassCard style={styles.actionCard}>
            <Text style={styles.actionLabel}>Restore from JSON Backup File</Text>
            <Text style={styles.actionDesc}>
              Select a previously exported Hisab OS backup file from your device storage or files app.
            </Text>
            <GlassButton
              title="Select File & Restore"
              variant="secondary"
              onPress={handleImport}
              disabled={loading}
              icon={<Feather name="upload" size={16} color={Colors.white} />}
              style={{ marginTop: 14 }}
            />
          </GlassCard>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.white} />
            <Text style={styles.loadingText}>{statusMessage}</Text>
          </View>
        )}

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
  infoCard: {
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionCard: {
    padding: 18,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
