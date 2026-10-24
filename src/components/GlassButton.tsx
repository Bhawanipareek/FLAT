import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { Colors } from '../theme/colors';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? Colors.black : Colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: Colors.white,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.glassBorderStrong,
  },
  dangerContainer: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  disabledContainer: {
    opacity: 0.4,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: Colors.black,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.textPrimary,
  },
  dangerText: {
    color: Colors.danger,
  },
});
