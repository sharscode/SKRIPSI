import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_constants.dart';
import '../models/user_model.dart';

class StorageService {
  static StorageService? _instance;
  static SharedPreferences? _prefs;

  StorageService._();

  static Future<StorageService> getInstance() async {
    _instance ??= StorageService._();
    _prefs ??= await SharedPreferences.getInstance();
    return _instance!;
  }

  // ─── Token Management ───
  Future<void> saveToken(String token) async {
    await _prefs!.setString(AppConstants.keyToken, token);
  }

  String? getToken() {
    return _prefs!.getString(AppConstants.keyToken);
  }

  Future<void> removeToken() async {
    await _prefs!.remove(AppConstants.keyToken);
  }

  // ─── Refresh Token Management ───
  Future<void> saveRefreshToken(String token) async {
    await _prefs!.setString(AppConstants.keyRefreshToken, token);
  }

  String? getRefreshToken() {
    return _prefs!.getString(AppConstants.keyRefreshToken);
  }

  Future<void> removeRefreshToken() async {
    await _prefs!.remove(AppConstants.keyRefreshToken);
  }

  // ─── User Data Management ───
  Future<void> saveUser(UserModel user) async {
    await _prefs!.setString(AppConstants.keyUserData, jsonEncode(user.toJson()));
  }

  UserModel? getUser() {
    final data = _prefs!.getString(AppConstants.keyUserData);
    if (data == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(data));
    } catch (_) {
      return null;
    }
  }

  Future<void> removeUser() async {
    await _prefs!.remove(AppConstants.keyUserData);
  }

  // ─── Check Auth State ───
  bool get isLoggedIn => getToken() != null;

  // ─── Clear All Data ───
  Future<void> clearAll() async {
    await _prefs!.remove(AppConstants.keyToken);
    await _prefs!.remove(AppConstants.keyRefreshToken);
    await _prefs!.remove(AppConstants.keyUserData);
  }
}
