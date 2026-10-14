import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors - Clean White & Fresh Green Accent
  static const Color primary = Color(0xFF059669); // Emerald 600
  static const Color primaryLight = Color(0xFF10B981); // Emerald 500
  static const Color primaryDark = Color(0xFF047857); // Emerald 700
  static const Color primaryContainer = Color(0xFFD1FAE5); // Emerald 100
  static const Color onPrimaryContainer = Color(0xFF064E3B); // Emerald 900

  static const Color secondary = Color(0xFF0D9488); // Teal 600
  static const Color secondaryContainer = Color(0xFFCCFBF1); // Teal 100
  static const Color onSecondaryContainer = Color(0xFF115E59);

  // Neutral Colors (Light)
  static const Color backgroundLight = Color(0xFFF9FAFB); // Gray 50
  static const Color surfaceLight = Colors.white;
  static const Color cardLight = Colors.white;
  static const Color borderLight = Color(0xFFE5E7EB); // Gray 200
  static const Color textPrimaryLight = Color(0xFF111827); // Gray 900
  static const Color textSecondaryLight = Color(0xFF4B5563); // Gray 600
  static const Color textMutedLight = Color(0xFF9CA3AF); // Gray 400

  // Neutral Colors (Dark)
  static const Color backgroundDark = Color(0xFF111827); // Gray 900
  static const Color surfaceDark = Color(0xFF1F2937); // Gray 800
  static const Color cardDark = Color(0xFF1F2937);
  static const Color borderDark = Color(0xFF374151); // Gray 700
  static const Color textPrimaryDark = Color(0xFFF9FAFB); // Gray 50
  static const Color textSecondaryDark = Color(0xFFD1D5DB); // Gray 300
  static const Color textMutedDark = Color(0xFF6B7280); // Gray 500

  // Semantic Status Colors
  static const Color success = Color(0xFF10B981); // Green
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color error = Color(0xFFEF4444); // Red
  static const Color info = Color(0xFF3B82F6); // Blue

  // Badges & Sync Status
  static const Color syncConnected = Color(0xFF10B981);
  static const Color syncSyncing = Color(0xFF3B82F6);
  static const Color syncOffline = Color(0xFF9CA3AF);
  static const Color syncFailed = Color(0xFFEF4444);
}
