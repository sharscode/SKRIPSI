import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';
import '../models/latihan_model.dart';

class NotificationHelper {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    if (kIsWeb) return;
    try {
      // Initialize timezone database
      try {
        tz.initializeTimeZones();
        String? timeZoneName;
        try {
          timeZoneName = (await FlutterTimezone.getLocalTimezone()).identifier;
          tz.setLocalLocation(tz.getLocation(timeZoneName));
          debugPrint('Notification timezone set to: $timeZoneName');
        } catch (locationErr) {
          debugPrint('Location $timeZoneName not found in timezone database: $locationErr. Trying Asia/Jakarta.');
          try {
            tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));
            debugPrint('Notification timezone set to fallback: Asia/Jakarta');
          } catch (_) {
            debugPrint('Asia/Jakarta fallback failed. Defaulting to UTC.');
            tz.setLocalLocation(tz.UTC);
          }
        }
      } catch (tzInitErr) {
        debugPrint('Timezone initialization failed: $tzInitErr. Using UTC.');
        tz.setLocalLocation(tz.UTC);
      }

      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _notificationsPlugin.initialize(
        settings: initializationSettings,
      );
      debugPrint('Local notifications plugin initialized successfully.');

      // Request permissions for Android 13+
      final androidImplementation = _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

      await androidImplementation?.requestNotificationsPermission();

      // Request exact alarm permission for Android 13/14+
      try {
        final exactGranted = await androidImplementation?.requestExactAlarmsPermission();
        debugPrint('Exact alarms permission request result: $exactGranted');
      } catch (exactErr) {
        debugPrint('Error requesting exact alarms permission: $exactErr');
      }
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
        'pcu_choir_channel_id',
        'PCU Choir Notifications',
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
        final duration = scheduledTime.difference(now);
        final tz.TZDateTime scheduledDate = tz.TZDateTime.now(tz.local).add(duration);

        debugPrint('[Schedule Notification] Latihan $id details:');
        debugPrint('  - Duration until trigger: ${duration.inSeconds} seconds (${duration.inMinutes} minutes)');
        debugPrint('  - scheduledDate (tz.local): $scheduledDate');
        debugPrint('  - scheduledDate.toUtc(): ${scheduledDate.toUtc()}');
        debugPrint('  - tz.local: ${tz.local.name}');

        try {
          await _notificationsPlugin.zonedSchedule(
            id: reminderId,
            title: title,
            body: body,
            scheduledDate: scheduledDate,
            notificationDetails: platformChannelSpecifics,
            androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          );
          debugPrint('  - Scheduled EXACT reminder for Latihan $id successfully.');
        } catch (scheduleErr) {
          debugPrint('  - Exact scheduling failed: $scheduleErr. Falling back to inexact.');
          await _notificationsPlugin.zonedSchedule(
            id: reminderId,
            title: title,
            body: body,
            scheduledDate: scheduledDate,
            notificationDetails: platformChannelSpecifics,
            androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          );
          debugPrint('  - Scheduled INEXACT reminder for Latihan $id successfully.');
        }
      } else {
        debugPrint('[Schedule Notification] Scheduled time is in the past. Skipping schedule for Latihan $id.');
      }
    } catch (e) {
      debugPrint('Error scheduling local notification: $e');
    }
  }

  static Future<void> cancelLatihanNotification(int id) async {
    if (kIsWeb) return;
    try {
      await _notificationsPlugin.cancel(id: 1000000 + id);
      debugPrint('Cancelled scheduled reminder for Latihan $id (reminderId: ${1000000 + id})');
    } catch (e) {
      debugPrint('Error cancelling notification: $e');
    }
  }

  static Future<void> syncLatihanReminders(List<LatihanModel> latihans) async {
    if (kIsWeb) return;
    debugPrint('[Sync Reminders] Initiating sync for ${latihans.length} rehearsals.');
    final now = DateTime.now();
    for (final l in latihans) {
      try {
        final cleanJam = l.jam.replaceAll('.', ':').replaceAll(RegExp(r'[^0-9:]'), '');
        if (cleanJam.isEmpty || l.tanggal.isEmpty) {
          debugPrint('  - Latihan ${l.id} has empty jam or tanggal. Skipping.');
          continue;
        }

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

        final parsedStr = '${l.tanggal}T$timePart+07:00';
        final practiceTime = DateTime.parse(parsedStr);
        final scheduledTime = practiceTime.subtract(Duration(minutes: l.waktuNotifikasi));

        debugPrint('[Sync Reminders] Latihan ${l.id}:');
        debugPrint('  - Tanggal/Jam: ${l.tanggal} / ${l.jam}');
        debugPrint('  - Waktu Notifikasi Offset: ${l.waktuNotifikasi} minutes');
        debugPrint('  - Parsed Practice Time: $practiceTime');
        debugPrint('  - Scheduled Notification Time: $scheduledTime');
        debugPrint('  - Current Device Time (Local): $now');

        if (scheduledTime.isAfter(now)) {
          final String title = 'Pengingat Latihan';
          final String body = '${l.tipeDisplay} hari ini pukul ${l.jam} WIB di ${l.lokasi}.';
          await scheduleLatihanNotification(
            id: l.id,
            title: title,
            body: body,
            scheduledTime: scheduledTime,
          );
        } else {
          debugPrint('  - Scheduled time is in the past. Doing nothing so active notification in drawer is not cleared.');
        }
      } catch (e) {
        debugPrint('Error syncing reminder for Latihan ${l.id}: $e');
      }
    }
    debugPrint('[Sync Reminders] Completed sync.');
  }
}
