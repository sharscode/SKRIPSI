class AppConstants {
  static const String appName = 'PCU Choir';
  static const String appTagline = 'Paduan Suara PCU';
  static const String appVersion = '2.0.0';

  // SharedPreferences keys
  static const String keyToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserData = 'user_data';

  // Voice parts
  static const List<String> voiceParts = ['sopran', 'alto', 'tenor', 'bass'];

  // Approval status values
  static const String statusApproved = 'disetujui';
  static const String statusPending = 'menunggu';
  static const String statusRejected = 'ditolak';

  // Attendance status values
  static const String attendanceHadir = 'hadir';
  static const String attendanceIzin = 'izin';
  static const String attendanceSakit = 'sakit';
  static const String attendanceAlpha = 'alpha';

  // Event status values
  static const String eventAktif = 'aktif';
  static const String eventSelesai = 'selesai';
}
