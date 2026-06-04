import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  UserModel? _user;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _authService.getCurrentUser();

      // Wire up API service auth failure callback
      ApiService().setAuthFailedCallback(() {
        logout();
      });
    } catch (_) {
      _user = null;
    }

    _isLoading = false;
    _isInitialized = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.login(email, password);

    _isLoading = false;

    if (result.success) {
      _user = result.user;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result.message;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      final storage = await StorageService.getInstance();
      _user = storage.getUser();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> updateProfile({String? alamat, String? kontak, String? jurusan, String? tanggalLahir}) async {
    if (_user == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final api = ApiService();
      final body = <String, dynamic>{};
      if (alamat != null) body['alamat'] = alamat;
      if (kontak != null) body['kontak'] = kontak;
      if (jurusan != null) body['jurusan'] = jurusan;
      if (tanggalLahir != null) body['tanggal_lahir'] = tanggalLahir;

      final result = await api.put('/anggota/${_user!.id}', body);

      if (result['success'] == true) {
        _user = _user!.copyWith(
          alamat: alamat,
          kontak: kontak,
          jurusan: jurusan,
          tanggalLahir: tanggalLahir,
        );
        final storage = await StorageService.getInstance();
        await storage.saveUser(_user!);
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
