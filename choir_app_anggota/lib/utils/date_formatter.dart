import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final _monthNames = [
    '', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
    'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
  ];

  static final _monthFullNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  /// Parse a date string to day number string (e.g. "27").
  static String dayFromString(String dateStr) {
    final parts = dateStr.split('-');
    return parts.length >= 3 ? parts[2] : '--';
  }

  /// Parse a date string to short month name (e.g. "MEI").
  static String monthShortFromString(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length >= 2) {
      final m = int.tryParse(parts[1]) ?? 0;
      if (m >= 1 && m <= 12) return _monthNames[m];
    }
    return '---';
  }

  /// Format "2025-05-27" → "27 Mei 2025".
  static String formatDateLong(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    final year = parts[0];
    final month = int.tryParse(parts[1]) ?? 0;
    final day = parts[2];
    if (month < 1 || month > 12) return dateStr;
    return '$day ${_monthFullNames[month]} $year';
  }

  /// Format "2025-05-27" → "27 Mei".
  static String formatDateShort(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    final month = int.tryParse(parts[1]) ?? 0;
    final day = parts[2];
    if (month < 1 || month > 12) return dateStr;
    return '$day ${_monthFullNames[month]}';
  }

  /// Get countdown text from now to a date string.
  static String countdown(String dateStr) {
    try {
      final target = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = target.difference(now);

      if (diff.isNegative) return 'Sudah lewat';
      if (diff.inDays > 0) return '${diff.inDays} hari lagi';
      if (diff.inHours > 0) return '${diff.inHours} jam lagi';
      if (diff.inMinutes > 0) return '${diff.inMinutes} menit lagi';
      return 'Sebentar lagi';
    } catch (_) {
      return '';
    }
  }

  /// Format DateTime to "dd MMM yyyy, HH:mm".
  static String formatDateTime(DateTime dt) {
    return DateFormat('dd MMM yyyy, HH:mm').format(dt);
  }

  /// Format time string for display.
  static String formatTime(String? time) {
    if (time == null || time.isEmpty) return '-';
    // Handle HH:mm:ss → HH:mm
    if (time.length > 5 && time.contains(':')) {
      return time.substring(0, 5);
    }
    return time;
  }
}
