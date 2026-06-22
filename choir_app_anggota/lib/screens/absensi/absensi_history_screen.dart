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
  String _selectedFilter = 'Semua';

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
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final filteredHistory = _history.where((a) {
      if (_selectedFilter == 'Semua') return true;
      if (_selectedFilter == 'UKM') return a.isRutin;
      if (_selectedFilter == 'Acara') return !a.isRutin;
      return true;
    }).toList();

    final total = filteredHistory.length;
    final activeStats = {
      'hadir': filteredHistory.where((a) => a.status == 'hadir').length,
      'izin': filteredHistory.where((a) => a.status == 'izin').length,
      'sakit': filteredHistory.where((a) => a.status == 'sakit').length,
      'alpha': filteredHistory.where((a) => a.status == 'alpha').length,
    };
    final pct = total > 0
        ? ((activeStats['hadir']! / total) * 100).toStringAsFixed(1)
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
                        padding: const EdgeInsets.fromLTRB(16, 60, 16, 60),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _statPill('$pct%', 'Kehadiran', Colors.white),
                            _statPill('${activeStats['hadir']}', 'Hadir', AppColors.successLight),
                            _statPill('${activeStats['izin']}', 'Izin', AppColors.warningLight),
                            _statPill('${activeStats['sakit']}', 'Sakit', const Color(0xFFED8936)),
                            _statPill('${activeStats['alpha']}', 'Alpha', AppColors.dangerLight),
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
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _buildFilterChip('Semua Latihan', 'Semua', Icons.grid_view_rounded),
                      const SizedBox(width: 8),
                      _buildFilterChip('Latihan UKM', 'UKM', Icons.school_rounded),
                      const SizedBox(width: 8),
                      _buildFilterChip('Latihan Acara', 'Acara', Icons.event_rounded),
                    ],
                  ),
                ),
              ),
            ),
            if (filteredHistory.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: EmptyState(
                      emoji: '📋',
                      title: 'Tidak ada riwayat',
                      subtitle: 'Tidak ada riwayat absensi yang cocok dengan filter ini',
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) {
                      final a = filteredHistory[i];
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
                    childCount: filteredHistory.length,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, IconData icon) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = value;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary100 : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary400 : AppColors.neutral200,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary400.withOpacity(0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? AppColors.primary700 : AppColors.neutral500,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? AppColors.primary800 : AppColors.neutral700,
              ),
            ),
          ],
        ),
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
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600),
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
