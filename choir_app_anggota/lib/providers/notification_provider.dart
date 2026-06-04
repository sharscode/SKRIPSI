import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationProvider with ChangeNotifier {
  final _api = ApiService();

  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _api.get('/notification');
      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        _notifications = list
            .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
            .toList();
        _unreadCount = _notifications.where((n) => !n.isRead).length;
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAllRead() async {
    try {
      await _api.patch('/notification/mark-all-read', {});
      for (var n in _notifications) {
        n = NotificationModel(
          id: n.id, judul: n.judul, pesan: n.pesan,
          tipe: n.tipe, isRead: true, createdAt: n.createdAt,
          acaraId: n.acaraId, latihanId: n.latihanId,
        );
      }
      _unreadCount = 0;
      // Re-fetch to get updated state
      fetchNotifications();
    } catch (_) {}
  }

  Future<void> markRead(int id) async {
    try {
      await _api.patch('/notification/$id/read', {});
      await fetchNotifications();
    } catch (_) {}
  }
}
