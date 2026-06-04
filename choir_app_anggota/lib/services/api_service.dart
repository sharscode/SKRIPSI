import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._();
  factory ApiService() => _instance;
  ApiService._();

  StorageService? _storage;
  VoidAuthCallback? _onAuthFailed;

  Future<StorageService> get _storageService async {
    _storage ??= await StorageService.getInstance();
    return _storage!;
  }

  /// Set a callback to be called when authentication fails (e.g., for logout).
  void setAuthFailedCallback(VoidAuthCallback callback) {
    _onAuthFailed = callback;
  }

  Future<Map<String, String>> _buildHeaders({bool withAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (withAuth) {
      final storage = await _storageService;
      final token = storage.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  /// Attempt to refresh the access token.
  Future<bool> _refreshToken() async {
    try {
      final storage = await _storageService;
      final refreshToken = storage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null && data['data']['accessToken'] != null) {
          await storage.saveToken(data['data']['accessToken']);
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Core request method with automatic 401 retry via token refresh.
  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool withAuth = true,
  }) async {
    try {
      final headers = await _buildHeaders(withAuth: withAuth);
      final uri = Uri.parse('${ApiConfig.baseUrl}$path');

      http.Response response;
      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: headers);
          break;
        case 'POST':
          response = await http.post(uri, headers: headers, body: jsonEncode(body));
          break;
        case 'PUT':
          response = await http.put(uri, headers: headers, body: jsonEncode(body));
          break;
        case 'PATCH':
          response = await http.patch(uri, headers: headers, body: jsonEncode(body));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers);
          break;
        default:
          return {'success': false, 'message': 'Metode HTTP tidak didukung'};
      }

      // Handle 401: try to refresh token and retry once
      if (response.statusCode == 401 && withAuth) {
        final refreshed = await _refreshToken();
        if (refreshed) {
          // Retry with new token
          final retryHeaders = await _buildHeaders(withAuth: true);
          switch (method) {
            case 'GET':
              response = await http.get(uri, headers: retryHeaders);
              break;
            case 'POST':
              response = await http.post(uri, headers: retryHeaders, body: jsonEncode(body));
              break;
            case 'PUT':
              response = await http.put(uri, headers: retryHeaders, body: jsonEncode(body));
              break;
            case 'PATCH':
              response = await http.patch(uri, headers: retryHeaders, body: jsonEncode(body));
              break;
            case 'DELETE':
              response = await http.delete(uri, headers: retryHeaders);
              break;
          }

          // If still 401, trigger auth failure
          if (response.statusCode == 401) {
            _onAuthFailed?.call();
            return {'success': false, 'message': 'Sesi telah berakhir. Silakan login kembali.'};
          }
        } else {
          _onAuthFailed?.call();
          return {'success': false, 'message': 'Sesi telah berakhir. Silakan login kembali.'};
        }
      }

      // Parse response
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
        return {'success': true, 'data': decoded};
      } catch (_) {
        return {
          'success': response.statusCode >= 200 && response.statusCode < 300,
          'message': response.body,
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi gagal. Periksa jaringan Anda.'};
    }
  }

  // ─── Public HTTP Methods ───

  Future<Map<String, dynamic>> get(String path) =>
      _request('GET', path);

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) =>
      _request('POST', path, body: body);

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) =>
      _request('PUT', path, body: body);

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) =>
      _request('PATCH', path, body: body);

  Future<Map<String, dynamic>> delete(String path) =>
      _request('DELETE', path);
}

typedef VoidAuthCallback = void Function();
