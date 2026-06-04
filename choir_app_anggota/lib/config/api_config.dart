import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static const String _emulatorUrl  = 'http://10.0.2.2:3000/api';
  static const String _localhostUrl = 'http://localhost:3000/api';

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    
    if (kIsWeb) return _localhostUrl;
    if (Platform.isAndroid) return _emulatorUrl;
    return _localhostUrl;
  }

  static String get uploadsUrl {
    final uri = Uri.parse(baseUrl);
    return '${uri.scheme}://${uri.host}:${uri.port}/uploads';
  }

  static String get serverUrl {
    final uri = Uri.parse(baseUrl);
    return '${uri.scheme}://${uri.host}:${uri.port}';
  }
}
