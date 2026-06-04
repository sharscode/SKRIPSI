import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/absensi_model.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class AbsensiHistoryScreen extends StatefulWidget {
  const AbsensiHistoryScreen({super.key});

  @override
  State<AbsensiHistoryScreen> createState() => _AbsensiHistoryScreenState();
}

class _AbsensiHistoryScreenState extends State<AbsensiHistoryScreen> {
  final _api = ApiService();
  List<AbsensiModel> _history = [];
  bool _loading = true;
  Map<String, int> _stats = {'hadir': 0, 'izin': 0, 'sakit': 0, 'alpha': 0};

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _loading = true);
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;

    final result = await _api.get('/absensi/anggota/$userId');
    if (!mounted) return;

    if (result['success'] == true) {
      final list = (result['data'] as List<dynamic>? ?? []);
      _history = list
          .map((e) => AbsensiModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // Calculate stats
      _stats = {
        'hadir': _history.where((a) => a.status == 'hadir').length,
        'izin': _history.where((a) => a.status == 'izin').length,
        'sakit': _history.where((a) => a.status == 'sakit').length,
        'alpha': _history.where((a) => a.status == 'alpha').length,
      };
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final total = _history.length;
    final pct = total > 0
        ? ((_stats['hadir']! / total) * 100).toStringAsFixed(1)
        : '0.0';

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(56, 0, 20, 16),
              title: const Text(
                'Riwayat Absensi',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary800, AppColors.primary500],
                  ),
                ),
                child: _loading
                    ? const SizedBox.shrink()
                    : Padding(
                        padding: const EdgeInsets.fromLTRB(20, 60, 20, 60),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _statPill('$pct%', 'Kehadiran', Colors.white),
                            _statPill('${_stats['hadir']}', 'Hadir', AppColors.successLight),
                            _statPill('${_stats['izin']}', 'Izin', AppColors.warningLight),
                            _statPill('${_stats['alpha']}', 'Alpha', AppColors.dangerLight),
                          ],
                        ),
                      ),
              ),
            ),
          ),

          if (_loading)
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: LoadingShimmer(height: 80),
                  ),
                  childCount: 6,
                ),
              ),
            )
          else if (_history.isEmpty)
            const SliverFillRemaining(
              child: EmptyState(
                emoji: '📋',
                title: 'Belum ada riwayat',
                subtitle: 'Riwayat kehadiran kamu akan muncul di sini',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) {
                    final a = _history[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: AppCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            // Status indicator
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.attendanceStatusColor(a.status).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                _statusIcon(a.status),
                                color: AppColors.attendanceStatusColor(a.status),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    formatDate(a.tanggalLatihan, withDay: false),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.neutral800,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    a.lokasiLatihan ?? '-',
                                    style: const TextStyle(fontSize: 12, color: AppColors.neutral400),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (a.waktuCheckin != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      'Checkin: ${_formatTime(a.waktuCheckin!)}',
                                      style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            StatusBadge.fromStatus(a.status),
                          ],
                        ),
                      ),
                    );
                  },
                  childCount: _history.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _statPill(String value, String label, Color bgColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'hadir': return Icons.check_circle_rounded;
      case 'izin': return Icons.info_rounded;
      case 'sakit': return Icons.local_hospital_rounded;
      case 'alpha': default: return Icons.cancel_rounded;
    }
  }

  String _formatTime(String dt) {
    try {
      final parsed = DateTime.parse(dt).toLocal();
      return '${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')} WIB';
    } catch (_) {
      return dt;
    }
  }
}
