import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  /// Production backend URL (Render cloud)
  static const String _productionUrl = 'https://pcu-choir-api.onrender.com/api';

  /// Local dev URLs
  static const String _emulatorUrl  = 'http://10.0.2.2:3000/api';
  static const String _localhostUrl = 'http://localhost:3000/api';

  static String get baseUrl {
    // Override via --dart-define=API_BASE_URL=... at build time
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;

    if (kIsWeb) return _localhostUrl;
    // Android emulator: use 10.0.2.2 in debug, production URL in release
    if (Platform.isAndroid) {
      const bool isRelease = bool.fromEnvironment('dart.vm.product');
      return isRelease ? _productionUrl : _emulatorUrl;
    }
    return _localhostUrl;
  }

  static String get uploadsUrl {
    final uri = Uri.parse(baseUrl);
    // For production HTTPS, port is implicit — don't include it
    if (uri.scheme == 'https') {
      return 'https://${uri.host}/uploads';
    }
    return '${uri.scheme}://${uri.host}:${uri.port}/uploads';
  }

  static String get serverUrl {
    final uri = Uri.parse(baseUrl);
    if (uri.scheme == 'https') {
      return 'https://${uri.host}';
    }
    return '${uri.scheme}://${uri.host}:${uri.port}';
  }
}
