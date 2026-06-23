import 'package:flutter/material.dart';
import '../models/latihan_model.dart';
import '../services/api_service.dart';
import '../utils/notification_helper.dart';

class LatihanProvider with ChangeNotifier {
  final _api = ApiService();

  List<LatihanModel> _latihanList = [];
  List<LatihanModel> _upcomingLatihan = [];
  bool _isLoading = false;
  String? _error;

  List<LatihanModel> get latihanList => _latihanList;
  List<LatihanModel> get upcomingLatihan => _upcomingLatihan;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<LatihanModel> _filterAndSortUpcoming(List<LatihanModel> all) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    // 1. Keep only practices on or after today
    final futureLatihans = all.where((l) {
      final dt = l.tanggalAsDate;
      if (dt == null) return false;
      final lDate = DateTime(dt.year, dt.month, dt.day);
      return lDate.isAfter(today) || lDate.isAtSameMomentAs(today);
    }).toList();

    if (futureLatihans.isEmpty) return [];

    // 2. Find the minimum date (closest day)
    DateTime minDate = futureLatihans.map((l) {
      final dt = l.tanggalAsDate!;
      return DateTime(dt.year, dt.month, dt.day);
    }).reduce((value, element) => value.isBefore(element) ? value : element);

    // 3. Filter to keep only practices on minDate
    final closestDayLatihans = futureLatihans.where((l) {
      final dt = l.tanggalAsDate!;
      final lDate = DateTime(dt.year, dt.month, dt.day);
      return lDate.isAtSameMomentAs(minDate);
    }).toList();

    // 4. Sort by time (jam) ascending
    closestDayLatihans.sort((a, b) => a.jam.compareTo(b.jam));
    return closestDayLatihans;
  }

  Future<void> fetchAll({String? acaraId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final path = acaraId != null ? '/latihan?acara_id=$acaraId' : '/latihan';
      final result = await _api.get(path);
      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        _latihanList = list.map((e) => LatihanModel.fromJson(e as Map<String, dynamic>)).toList();
        _upcomingLatihan = _filterAndSortUpcoming(_latihanList);
        
        // Sync scheduled offline reminders
        NotificationHelper.syncLatihanReminders(_latihanList);
      }
    } catch (_) {
      _error = 'Gagal memuat jadwal latihan.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchUpcoming() async {
    try {
      final result = await _api.get('/latihan');
      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        final all = list.map((e) => LatihanModel.fromJson(e as Map<String, dynamic>)).toList();
        _upcomingLatihan = _filterAndSortUpcoming(all);
        
        // Sync scheduled offline reminders
        NotificationHelper.syncLatihanReminders(all);
        notifyListeners();
      }
    } catch (_) {}
  }
}
