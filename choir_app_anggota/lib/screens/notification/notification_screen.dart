import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/latihan_provider.dart';
import '../../providers/acara_provider.dart';
import '../../config/routes.dart';
import '../../models/notification_model.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<NotificationProvider>();
      final rehearsals = context.read<LatihanProvider>().latihanList;
      provider.updateRehearsals(rehearsals);
      provider.fetchNotifications();
    });
  }

  /// Tandai notifikasi terbaca, lalu buka acara terkait bila ada.
  /// Notifikasi acara membawa acaraId, jadi sentuhan bisa langsung mengantar
  /// anggota ke halaman acaranya, bukan berhenti sebagai pemberitahuan.
  void _bukaNotifikasi(NotificationModel notif, NotificationProvider provider) {
    provider.markRead(notif.id);
    if (notif.acaraId == null) return;

    final daftar = context.read<AcaraProvider>().acaraList;
    final idx = daftar.indexWhere((a) => a.id == notif.acaraId);
    if (idx == -1) return;

    Navigator.pushNamed(context, AppRoutes.eventDetail, arguments: daftar[idx]);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();
    final notifications = provider.notifications;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Notifikasi', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: AppColors.primary700,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (notifications.any((n) => !n.isRead))
            TextButton(
              onPressed: () => provider.markAllRead(),
              child: const Text(
                'Tandai Sudah Dibaca',
                style: TextStyle(color: Colors.white70, fontSize: 13),
              ),
            ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: const CircularProgressIndicator(color: AppColors.primary400))
          : notifications.isEmpty
              ? const EmptyState(
                  emoji: '🔔',
                  title: 'Belum ada notifikasi',
                  subtitle: 'Notifikasi akan muncul di sini',
                )
              : RefreshIndicator(
                  color: AppColors.primary400,
                  onRefresh: () => provider.fetchNotifications(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                    itemCount: notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _NotifCard(
                      notif: notifications[i],
                      onTap: () => _bukaNotifikasi(notifications[i], provider),
                    ),
                  ),
                ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final NotificationModel notif;
  final VoidCallback onTap;

  const _NotifCard({required this.notif, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isUnread = !notif.isRead;

    return Material(
      color: isUnread ? AppColors.primary50 : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isUnread ? AppColors.primary200 : AppColors.neutral200,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _tipeColor(notif.tipe).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_tipeIcon(notif.tipe), color: _tipeColor(notif.tipe), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notif.judul,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
                              color: AppColors.neutral800,
                            ),
                          ),
                        ),
                        if (isUnread)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary400,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notif.pesan,
                      style: const TextStyle(fontSize: 13, color: AppColors.neutral500, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          notif.timeAgo,
                          style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
                        ),
                        // Petunjuk bahwa notifikasi ini mengantar ke halaman acaranya.
                        if (notif.acaraId != null) ...[
                          const Spacer(),
                          const Text(
                            'Lihat acara',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.primary400,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded,
                              size: 16, color: AppColors.primary400),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _tipeColor(String tipe) {
    switch (tipe) {
      case 'latihan':
      case 'reminder_latihan': return AppColors.primary400;
      case 'acara':
      case 'info_acara': return AppColors.sopran;
      case 'absensi': return AppColors.success;
      case 'skkk':
      case 'approval': return AppColors.warning;
      default: return AppColors.neutral400;
    }
  }

  IconData _tipeIcon(String tipe) {
    switch (tipe) {
      case 'latihan':
      case 'reminder_latihan': return Icons.music_note_rounded;
      case 'acara':
      case 'info_acara': return Icons.event_rounded;
      case 'absensi': return Icons.check_circle_outline;
      case 'skkk':
      case 'approval': return Icons.workspace_premium_outlined;
      default: return Icons.notifications_outlined;
    }
  }
}
