import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class Helpers {
  Helpers._();

  /// Capitalize first letter of a string.
  static String capitalizeFirst(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }

  /// Get icon for attendance status.
  static IconData attendanceIcon(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        return LucideIcons.checkCircle;
      case 'izin':
        return LucideIcons.alertCircle;
      case 'sakit':
        return LucideIcons.heartPulse;
      case 'alpha':
      default:
        return LucideIcons.xCircle;
    }
  }

  /// Get icon for notification type.
  static IconData notificationIcon(String type) {
    switch (type.toLowerCase()) {
      case 'acara':
        return LucideIcons.calendar;
      case 'latihan':
        return LucideIcons.music;
      case 'absensi':
        return LucideIcons.checkCircle;
      case 'approval':
        return LucideIcons.userCheck;
      default:
        return LucideIcons.bell;
    }
  }

  /// Show a snackbar with a message.
  static void showSnackBar(
    BuildContext context,
    String message, {
    bool isError = false,
    bool isSuccess = false,
  }) {
    final color = isError
        ? const Color(0xFFEF4444)
        : isSuccess
            ? const Color(0xFF10B981)
            : null;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: color,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          margin: const EdgeInsets.all(16),
        ),
      );
  }

  /// Show a confirmation dialog and return the result.
  static Future<bool> showConfirmDialog(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Ya',
    String cancelText = 'Batal',
    bool isDangerous = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: isDangerous
                ? ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                  )
                : null,
            child: Text(confirmText),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}
