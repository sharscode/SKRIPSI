import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_model.dart';
import '../models/latihan_model.dart';
import '../services/api_service.dart';
import '../utils/notification_helper.dart';

class NotificationProvider with ChangeNotifier {
  final _api = ApiService();

  List<NotificationModel> _notifications = [];
  List<NotificationModel> _rawNotifications = [];
  List<LatihanModel> _rehearsals = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  Timer? _pollingTimer;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  void updateRehearsals(List<LatihanModel> rehearsals) {
    _rehearsals = rehearsals;
    _filterAndNotify();
  }

  void _filterAndNotify() {
    final now = DateTime.now();
    _notifications = _rawNotifications.where((n) {
      if (n.tipe == 'reminder_latihan' && n.latihanId != null) {
        final idx = _rehearsals.indexWhere((l) => l.id == n.latihanId);
        if (idx != -1) {
          final l = _rehearsals[idx];
          final scheduledTime = l.scheduledReminderTime;
          if (scheduledTime != null && now.isBefore(scheduledTime)) {
            // Rehearsal reminder time has not arrived yet. Hide it!
            return false;
          }
        }
      }
      return true;
    }).toList();
    _unreadCount = _notifications.where((n) => !n.isRead).length;
    notifyListeners();
  }

  Future<void> fetchNotifications() async {
    final showLoading = _notifications.isEmpty;
    if (showLoading) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final result = await _api.get('/notification');
      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        final fetchedNotifications = list
            .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
            .toList();

        // Check for new notifications to trigger local push notification
        if (fetchedNotifications.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          final lastId = prefs.getInt('last_shown_notification_id');
          
          if (lastId == null) {
            // First run: save the highest ID to suppress history notifications
            final maxId = fetchedNotifications.map((n) => n.id).reduce((a, b) => a > b ? a : b);
            await prefs.setInt('last_shown_notification_id', maxId);
          } else {
            // Find all unread notifications that are newer than lastId
            final newUnread = fetchedNotifications.where((n) => !n.isRead && n.id > lastId).toList();
            if (newUnread.isNotEmpty) {
              // Trigger local notifications in chronological order (oldest first)
              for (final n in newUnread.reversed) {
                // Skip immediate popup for rehearsal reminders to let the scheduled local reminder handle it
                if (n.tipe == 'reminder_latihan') {
                  debugPrint('Skipping immediate notification popup for ${n.tipe} (ID: ${n.id}).');
                  continue;
                }
                await NotificationHelper.showNotification(
                  id: n.id,
                  title: n.judul,
                  body: n.pesan,
                );
              }
              // Save the new highest notification ID
              final maxId = fetchedNotifications.map((n) => n.id).reduce((a, b) => a > b ? a : b);
              await prefs.setInt('last_shown_notification_id', maxId);
            }
          }
        }

        _rawNotifications = fetchedNotifications;
        _filterAndNotify();
      }
    } catch (_) {}

    if (showLoading) {
      _isLoading = false;
      notifyListeners();
    }
  }

  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      fetchNotifications();
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> markAllRead() async {
    try {
      await _api.patch('/notification/read-all', {});
      _rawNotifications = _rawNotifications.map((n) => NotificationModel(
        id: n.id,
        judul: n.judul,
        pesan: n.pesan,
        tipe: n.tipe,
        isRead: true,
        createdAt: n.createdAt,
        acaraId: n.acaraId,
        latihanId: n.latihanId,
      )).toList();
      _filterAndNotify();
      await fetchNotifications();
    } catch (_) {}
  }

  Future<void> markRead(int id) async {
    try {
      await _api.patch('/notification/$id/read', {});
      await fetchNotifications();
    } catch (_) {}
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
