import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../models/latihan_model.dart';

class NotificationHelper {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    if (kIsWeb) return;
    try {
      // Initialize timezone database
      tz.initializeTimeZones();

      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _notificationsPlugin.initialize(
        settings: initializationSettings,
      );

      // Request permissions for Android 13+
      await _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    } catch (e) {
      debugPrint('Error initializing local notifications: $e');
    }
  }

  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    if (kIsWeb) return;
    try {
      const AndroidNotificationDetails androidPlatformChannelSpecifics =
          AndroidNotificationDetails(
        'pcu_choir_channel_id',
        'PCU Choir Notifications',
        channelDescription: 'Notifications for PCU Choir events and practices',
        importance: Importance.max,
        priority: Priority.high,
        ticker: 'ticker',
      );

      const NotificationDetails platformChannelSpecifics = NotificationDetails(
        android: androidPlatformChannelSpecifics,
      );

      await _notificationsPlugin.show(
        id: id,
        title: title,
        body: body,
        notificationDetails: platformChannelSpecifics,
      );
    } catch (e) {
      debugPrint('Error showing local notification: $e');
    }
  }

  static Future<void> scheduleLatihanNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
  }) async {
    if (kIsWeb) return;
    try {
      const AndroidNotificationDetails androidPlatformChannelSpecifics =
          AndroidNotificationDetails(
        'pcu_choir_reminder_channel_id',
        'PCU Choir Reminders',
        channelDescription: 'Scheduled reminders for PCU Choir practices',
        importance: Importance.max,
        priority: Priority.high,
      );

      const NotificationDetails platformChannelSpecifics = NotificationDetails(
        android: androidPlatformChannelSpecifics,
      );

      final int reminderId = 1000000 + id;

      // Cancel first to prevent duplicates/updates
      await _notificationsPlugin.cancel(id: reminderId);

      final now = DateTime.now();
      if (scheduledTime.isAfter(now)) {
        try {
          await _notificationsPlugin.zonedSchedule(
            id: reminderId,
            title: title,
            body: body,
            scheduledDate: tz.TZDateTime.from(scheduledTime.toUtc(), tz.getLocation('UTC')),
            notificationDetails: platformChannelSpecifics,
            androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          );
          debugPrint('Scheduled exact reminder for Latihan $id at $scheduledTime (UTC: ${scheduledTime.toUtc()})');
        } catch (scheduleErr) {
          debugPrint('Exact scheduling failed, falling back to inexact schedule: $scheduleErr');
          await _notificationsPlugin.zonedSchedule(
            id: reminderId,
            title: title,
            body: body,
            scheduledDate: tz.TZDateTime.from(scheduledTime.toUtc(), tz.getLocation('UTC')),
            notificationDetails: platformChannelSpecifics,
            androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          );
          debugPrint('Scheduled inexact reminder for Latihan $id at $scheduledTime (UTC: ${scheduledTime.toUtc()})');
        }
      }
    } catch (e) {
      debugPrint('Error scheduling local notification: $e');
    }
  }

  static Future<void> cancelLatihanNotification(int id) async {
    if (kIsWeb) return;
    try {
      await _notificationsPlugin.cancel(id: 1000000 + id);
    } catch (e) {
      debugPrint('Error cancelling notification: $e');
    }
  }

  static Future<void> syncLatihanReminders(List<LatihanModel> latihans) async {
    if (kIsWeb) return;
    for (final l in latihans) {
      try {
        final cleanJam = l.jam.replaceAll('.', ':').replaceAll(RegExp(r'[^0-9:]'), '');
        if (cleanJam.isEmpty || l.tanggal.isEmpty) continue;

        // Ensure cleanJam is in HH:mm:ss format
        var timePart = cleanJam;
        final parts = timePart.split(':');
        if (parts.length == 1) {
          timePart = '${parts[0].padLeft(2, '0')}:00:00';
        } else if (parts.length == 2) {
          timePart = '${parts[0].padLeft(2, '0')}:${parts[1].padLeft(2, '0')}:00';
        } else if (parts.length == 3) {
          timePart = '${parts[0].padLeft(2, '0')}:${parts[1].padLeft(2, '0')}:${parts[2].padLeft(2, '0')}';
        }

        final practiceTime = DateTime.parse('${l.tanggal} $timePart');
        final scheduledTime = practiceTime.subtract(Duration(minutes: l.waktuNotifikasi));

        if (scheduledTime.isAfter(DateTime.now())) {
          final String title = 'Pengingat Latihan';
          final String body = '${l.tipeDisplay} hari ini pukul ${l.jam} WIB di ${l.lokasi}.';
          await scheduleLatihanNotification(
            id: l.id,
            title: title,
            body: body,
            scheduledTime: scheduledTime,
          );
        } else {
          // If the scheduled time is already in the past, make sure it is cancelled
          await cancelLatihanNotification(l.id);
        }
      } catch (e) {
        debugPrint('Error syncing reminder for Latihan ${l.id}: $e');
      }
    }
  }
}
