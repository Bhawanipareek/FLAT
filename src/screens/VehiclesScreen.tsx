import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { formatINR } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';
import {
  getAllVehicles,
  getVehicleFuelLogs,
  getVehicleServices,
  getVehicleStats,
} from '../db/queries/vehicles';
import { Vehicle, VehicleFuelLog, VehicleService } from '../types/database';

interface VehiclesScreenProps {
  onOpenAddVehicle: () => void;
  onOpenLogFuel: (vehicleId: string) => void;
  onOpenLogService: (vehicleId: string) => void;
}

export const VehiclesScreen: React.FC<VehiclesScreenProps> = ({
  onOpenAddVehicle,
  onOpenLogFuel,
  onOpenLogService,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [fuelLogs, setFuelLogs] = useState<VehicleFuelLog[]>([]);
  const [services, setServices] = useState<VehicleService[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadVehiclesData = () => {
    try {
      const list = getAllVehicles();
      setVehicles(list);

      const activeId = selectedVehicleId || (list.length > 0 ? list[0].id : null);
      setSelectedVehicleId(activeId);

      if (activeId) {
        setFuelLogs(getVehicleFuelLogs(activeId));
        setServices(getVehicleServices(activeId));
        setStats(getVehicleStats(activeId));
      }
    } catch (e) {
      console.error('Error loading vehicles:', e);
    }
  };

  useEffect(() => {
    loadVehiclesData();
  }, [selectedVehicleId]);

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>Vehicles</Text>
            <Text style={styles.pageSubtitle}>Fuel, Service & Maintenance</Text>
          </View>
          <GlassButton
            title="+ Vehicle"
            onPress={onOpenAddVehicle}
            style={styles.headerBtn}
          />
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.section}>
            <GlassCard style={styles.emptyCard}>
              <Feather name="navigation" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No vehicles added yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your Bike, Scooter or Car to track petrol, mileage and servicing
              </Text>
              <GlassButton
                title="Add Your First Vehicle"
                onPress={onOpenAddVehicle}
                style={{ marginTop: 16 }}
              />
            </GlassCard>
          </View>
        ) : (
          <>
            {/* Vehicle Selector Tabs */}
            <View style={styles.section}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleTabs}
              >
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.75}
                    onPress={() => setSelectedVehicleId(v.id)}
                    style={[
                      styles.vehicleTab,
                      selectedVehicleId === v.id && styles.activeVehicleTab,
                    ]}
                  >
                    <Feather
                      name={v.type === 'Car' ? 'truck' : 'navigation'}
                      size={14}
                      color={selectedVehicleId === v.id ? Colors.black : Colors.white}
                    />
                    <Text
                      style={[
                        styles.vehicleTabName,
                        selectedVehicleId === v.id && styles.activeVehicleTabName,
                      ]}
                    >
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Active Vehicle Hero Card */}
            {activeVehicle && (
              <View style={styles.section}>
                <GlassCard style={styles.heroCard}>
                  <View style={styles.cardTopRow}>
                    <View>
                      <Text style={styles.vehName}>{activeVehicle.name}</Text>
                      <Text style={styles.vehModel}>
                        {activeVehicle.manufacturer} {activeVehicle.model} • {activeVehicle.reg_number || 'No Plate'}
                      </Text>
                    </View>
                    <View style={styles.fuelTypePill}>
                      <Text style={styles.fuelTypeText}>{activeVehicle.fuel_type}</Text>
                    </View>
                  </View>

                  <View style={styles.odometerBox}>
                    <Text style={styles.odometerLabel}>CURRENT ODOMETER</Text>
                    <Text style={styles.odometerValue}>
                      {activeVehicle.current_odometer.toLocaleString('en-IN')} <Text style={styles.kmUnit}>km</Text>
                    </Text>
                  </View>

                  {/* Monthly & Mileage Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>This Month</Text>
                      <Text style={styles.statVal}>{formatINR(stats?.monthlyExpense || 0)}</Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Average Mileage</Text>
                      <Text style={[styles.statVal, { color: stats?.averageMileage ? Colors.success : Colors.textMuted }]}>
                        {stats?.averageMileage ? `${stats.averageMileage} km/L` : 'Need logs'}
                      </Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Lifetime Cost</Text>
                      <Text style={styles.statVal}>{formatINR(stats?.lifetimeExpense || 0)}</Text>
                    </View>
                  </View>

                  {/* Actions for this vehicle */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => onOpenLogFuel(activeVehicle.id)}
                      style={styles.cardBtnPrimary}
                    >
                      <Feather name="zap" size={14} color={Colors.black} />
                      <Text style={styles.cardBtnTextPrimary}>+ Log Petrol / Fuel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => onOpenLogService(activeVehicle.id)}
                      style={styles.cardBtnSecondary}
                    >
                      <Feather name="tool" size={14} color={Colors.white} />
                      <Text style={styles.cardBtnTextSecondary}>+ Log Service</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>
            )}

            {/* Fuel Logs List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Fuel Refills</Text>
                {activeVehicle && (
                  <TouchableOpacity
                    onPress={() => onOpenLogFuel(activeVehicle.id)}
                    style={styles.addInline}
                  >
                    <Text style={styles.addInlineText}>+ Add Fuel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {fuelLogs.length === 0 ? (
                <GlassCard style={styles.subEmptyCard}>
                  <Text style={styles.subEmptyText}>No fuel entries logged yet.</Text>
                </GlassCard>
              ) : (
                <GlassCard style={styles.recordsCard}>
                  {fuelLogs.slice(0, 5).map((log, idx) => (
                    <View
                      key={log.id}
                      style={[
                        styles.recordRow,
                        idx !== Math.min(fuelLogs.length, 5) - 1 && styles.recordBorder,
                      ]}
                    >
                      <View style={styles.recordLeft}>
                        <View style={styles.recordIconCircle}>
                          <Feather name="zap" size={15} color={Colors.warning} />
                        </View>
                        <View>
                          <Text style={styles.recordMain}>
                            {log.quantity_litres} L @ {formatINR(log.price_per_litre)}/L
                          </Text>
                          <Text style={styles.recordSub}>
                            {formatDisplayDate(log.date)} • {log.odometer} km
                            {log.is_full_tank ? ' • Full Tank' : ''}
                          </Text>
                          {log.calculated_mileage ? (
                            <Text style={styles.mileageBadge}>
                              ⚡ Mileage: {log.calculated_mileage} km/L
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.recordAmount}>{formatINR(log.total_cost)}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}
            </View>

            {/* Service & Repair History */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Service & Repairs</Text>
                {activeVehicle && (
                  <TouchableOpacity
                    onPress={() => onOpenLogService(activeVehicle.id)}
                    style={styles.addInline}
                  >
                    <Text style={styles.addInlineText}>+ Add Service</Text>
                  </TouchableOpacity>
                )}
              </View>

              {services.length === 0 ? (
                <GlassCard style={styles.subEmptyCard}>
                  <Text style={styles.subEmptyText}>No maintenance records logged yet.</Text>
                </GlassCard>
              ) : (
                <GlassCard style={styles.recordsCard}>
                  {services.slice(0, 5).map((srv, idx) => (
                    <View
                      key={srv.id}
                      style={[
                        styles.recordRow,
                        idx !== Math.min(services.length, 5) - 1 && styles.recordBorder,
                      ]}
                    >
                      <View style={styles.recordLeft}>
                        <View style={[styles.recordIconCircle, { backgroundColor: Colors.infoSoft }]}>
                          <Feather name="tool" size={15} color={Colors.info} />
                        </View>
                        <View>
                          <Text style={styles.recordMain}>{srv.service_type}</Text>
                          <Text style={styles.recordSub}>
                            {formatDisplayDate(srv.service_date)} • {srv.odometer} km
                          </Text>
                          {srv.work_performed ? (
                            <Text style={styles.recordNotes}>{srv.work_performed}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.recordAmount}>{formatINR(srv.total_cost)}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}
            </View>
          </>
        )}

        {/* Safe bottom spacing */}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  addInline: {
    paddingVertical: 2,
  },
  addInlineText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  vehicleTabs: {
    gap: 8,
  },
  vehicleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  activeVehicleTab: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  vehicleTabName: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeVehicleTabName: {
    color: Colors.black,
    fontWeight: '700',
  },
  heroCard: {
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  vehModel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fuelTypePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  fuelTypeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
  },
  odometerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 14,
  },
  odometerLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  odometerValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  kmUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    height: 42,
    borderRadius: 12,
  },
  cardBtnTextPrimary: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.black,
  },
  cardBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    height: 42,
    borderRadius: 12,
  },
  cardBtnTextSecondary: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.white,
  },
  subEmptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  subEmptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  recordsCard: {
    paddingHorizontal: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recordBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordMain: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.white,
  },
  recordSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mileageBadge: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  recordNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  recordAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.white,
  },
});
