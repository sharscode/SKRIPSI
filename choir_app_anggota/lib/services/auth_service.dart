import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<({bool success, String message, UserModel? user})> login(
    String email,
    String password,
  ) async {
    try {
      final result = await _api.post('/auth/login-anggota', {
        'email': email,
        'password': password,
      });

      if (result['success'] == true && result['data'] != null) {
        final storage = await StorageService.getInstance();
        final dataPayload = result['data'];

        // Save tokens
        if (dataPayload['accessToken'] != null) {
          await storage.saveToken(dataPayload['accessToken']);
        }
        if (dataPayload['refreshToken'] != null) {
          await storage.saveRefreshToken(dataPayload['refreshToken']);
        }

        // Save user data
        UserModel? user;
        if (dataPayload['user'] != null) {
          user = UserModel.fromJson(dataPayload['user']);
          await storage.saveUser(user);
        }

        return (
          success: true,
          message: result['message']?.toString() ?? 'Login berhasil',
          user: user,
        );
      } else {
        return (
          success: false,
          message: result['message']?.toString() ?? 'Login gagal',
          user: null,
        );
      }
    } catch (e) {
      return (
        success: false,
        message: 'Terjadi kesalahan koneksi',
        user: null,
      );
    }
  }

  Future<void> logout() async {
    final storage = await StorageService.getInstance();
    await storage.clearAll();
  }

  Future<bool> refreshToken() async {
    try {
      final storage = await StorageService.getInstance();
      final refreshToken = storage.getRefreshToken();
      if (refreshToken == null) return false;

      final result = await _api.post('/auth/refresh', {
        'refreshToken': refreshToken,
      });

      if (result['success'] == true && result['data'] != null && result['data']['accessToken'] != null) {
        await storage.saveToken(result['data']['accessToken']);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<UserModel?> getCurrentUser() async {
    final storage = await StorageService.getInstance();
    return storage.getUser();
  }

  Future<bool> isLoggedIn() async {
    final storage = await StorageService.getInstance();
    return storage.isLoggedIn;
  }
}
