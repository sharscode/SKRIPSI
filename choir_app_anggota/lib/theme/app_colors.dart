import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary (PCU Choir Blue)
  static const Color primary50 = Color(0xFFEEF3F8);
  static const Color primary100 = Color(0xFFD4E1EE);
  static const Color primary200 = Color(0xFFA9C3DD);
  static const Color primary300 = Color(0xFF8BABC9);
  static const Color primary400 = Color(0xFF6B91B8); // BRAND
  static const Color primary500 = Color(0xFF5578A0);
  static const Color primary600 = Color(0xFF3F5F88);
  static const Color primary700 = Color(0xFF2A4670);
  static const Color primary800 = Color(0xFF1A2F50);
  static const Color primary900 = Color(0xFF0D1B30);

  // Neutral
  static const Color neutral50 = Color(0xFFF8FAFC);
  static const Color neutral100 = Color(0xFFF1F5F9);
  static const Color neutral200 = Color(0xFFE2E8F0);
  static const Color neutral300 = Color(0xFFCBD5E1);
  static const Color neutral400 = Color(0xFF94A3B8);
  static const Color neutral500 = Color(0xFF64748B);
  static const Color neutral600 = Color(0xFF475569);
  static const Color neutral700 = Color(0xFF334155);
  static const Color neutral800 = Color(0xFF1E293B);
  static const Color neutral900 = Color(0xFF0F172A);

  // Semantic
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFDBEAFE);

  // Voice part colors
  static const Color sopran = Color(0xFF8B5CF6);
  static const Color alto = Color(0xFF10B981);
  static const Color tenor = Color(0xFF3B82F6);
  static const Color bass = Color(0xFFF59E0B);

  static const MaterialColor primarySwatch = MaterialColor(0xFF6B91B8, {
    50: primary50,
    100: primary100,
    200: primary200,
    300: primary300,
    400: primary400,
    500: primary500,
    600: primary600,
    700: primary700,
    800: primary800,
    900: primary900,
  });

  /// Returns the color associated with a voice part name.
  static Color voicePartColor(String part) {
    switch (part.toLowerCase()) {
      case 'sopran':
        return sopran;
      case 'alto':
        return alto;
      case 'tenor':
        return tenor;
      case 'bass':
        return bass;
      default:
        return neutral400;
    }
  }

  /// Returns the color associated with an attendance status.
  static Color attendanceStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        return success;
      case 'izin':
        return warning;
      case 'sakit':
        return const Color(0xFFED8936);
      case 'alpha':
      default:
        return danger;
    }
  }

  /// Returns the color associated with an approval status.
  static Color approvalStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'disetujui':
      case 'approved':
        return success;
      case 'menunggu':
      case 'pending':
        return warning;
      case 'ditolak':
      case 'rejected':
        return danger;
      default:
        return neutral400;
    }
  }
}
