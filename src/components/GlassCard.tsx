import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'primary' }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return Colors.surfaceSecondary;
      case 'accent':
        return 'rgba(255, 255, 255, 0.06)';
      default:
        return Colors.surfacePrimary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor() }, style]}>
      {/* Subtle top edge highlight line for glassmorphic depth */}
      <View style={styles.highlightLine} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  highlightLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
