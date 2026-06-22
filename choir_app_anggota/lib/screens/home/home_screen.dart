import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/acara_provider.dart';
import '../../providers/latihan_provider.dart';
import '../../providers/notification_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';
import '../../models/acara_model.dart';
import '../../models/latihan_model.dart';
import '../../models/peserta_model.dart';
import '../main_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchData());
  }

  void _fetchData() {
    final userId = context.read<AuthProvider>().user?.id;
    context.read<AcaraProvider>().fetchAll(userAnggotaId: userId);
    context.read<LatihanProvider>().fetchAll();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final unread = context.watch<NotificationProvider>().unreadCount;

    final acaraProvider = context.watch<AcaraProvider>();
    final allEvents = acaraProvider.acaraList;
    final myRegs = acaraProvider.myRegistrations;

    final latihanProvider = context.watch<LatihanProvider>();
    final allPractices = latihanProvider.latihanList;

    // Filter My Upcoming Acara (Active, registered & approved, on or after today)
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final myActiveRegIds = myRegs
        .where((r) => r.approvalStatus == 'disetujui')
        .map((r) => r.acaraId)
        .toSet();

    final myUpcomingList = allEvents.where((a) {
      if (a.status != 'aktif') return false;
      final dt = a.tanggalAsDate;
      if (dt == null) return false;
      final aDate = DateTime(dt.year, dt.month, dt.day);
      if (aDate.isBefore(today)) return false;
      return myActiveRegIds.contains(a.id);
    }).toList();
    myUpcomingList.sort((a, b) => a.tanggal.compareTo(b.tanggal));
    final myUpcoming = myUpcomingList.isNotEmpty ? myUpcomingList.first : null;

    // Filter Global Upcoming Acara (Active, on or after today)
    final globalUpcomingList = allEvents.where((a) {
      if (a.status != 'aktif') return false;
      final dt = a.tanggalAsDate;
      if (dt == null) return false;
      final aDate = DateTime(dt.year, dt.month, dt.day);
      return aDate.isAfter(today) || aDate.isAtSameMomentAs(today);
    }).toList();
    globalUpcomingList.sort((a, b) => a.tanggal.compareTo(b.tanggal));
    final globalUpcoming = globalUpcomingList.isNotEmpty ? globalUpcomingList.first : null;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: RefreshIndicator(
        color: AppColors.primary400,
        onRefresh: () async => _fetchData(),
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary800, AppColors.primary600],
                  ),
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top row
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Hai!',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.white.withOpacity(0.7),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    user?.firstName ?? 'Anggota',
                                    style: const TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                  if (user?.bagianSuara != null && user!.bagianSuara.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      user!.bagianSuaraDisplay,
                                      style: TextStyle(
                                        fontSize: 15,
                                        color: Colors.white.withOpacity(0.85),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            // Notification bell only
                            GestureDetector(
                              onTap: () => Navigator.pushNamed(
                                context, AppRoutes.notifications,
                              ),
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.notifications_outlined,
                                      color: Colors.white,
                                      size: 22,
                                    ),
                                  ),
                                  if (unread > 0)
                                    Positioned(
                                      right: -4,
                                      top: -4,
                                      child: Container(
                                        width: 18,
                                        height: 18,
                                        decoration: const BoxDecoration(
                                          color: AppColors.danger,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Center(
                                          child: Text(
                                            unread > 9 ? '9+' : '$unread',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // ── Quick Actions ────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _quickAction(
                        icon: Icons.qr_code_scanner_rounded,
                        label: 'Scan QR',
                        color: AppColors.primary400,
                        onTap: () => Navigator.pushNamed(context, AppRoutes.scanQr),
                      ),
                      const SizedBox(width: 12),
                      _quickAction(
                        icon: Icons.history_rounded,
                        label: 'Absensi',
                        color: AppColors.success,
                        onTap: () => Navigator.pushNamed(context, AppRoutes.absensiHistory),
                      ),
                      const SizedBox(width: 12),
                      _quickAction(
                        icon: Icons.event_rounded,
                        label: 'Regist\nAcara',
                        color: AppColors.sopran,
                        onTap: () => Navigator.pushNamed(context, AppRoutes.eventRegister),
                      ),
                      const SizedBox(width: 12),
                      _quickAction(
                        icon: Icons.library_music_rounded,
                        label: 'Partitur',
                        color: AppColors.warning,
                        onTap: () => MainScreen.of(context)?.setIndex(3),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Upcoming Latihan ─────────────────────────────
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Latihan Mendatang',
                actionLabel: 'Lihat Semua',
                onAction: () => MainScreen.of(context)?.setIndex(2),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            SliverToBoxAdapter(child: _buildUpcomingLatihan()),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Acara Mendatang (Personal) ───────────────────
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Acara Mendatang',
                actionLabel: 'Lihat Semua',
                onAction: () => MainScreen.of(context)?.setIndex(1),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            SliverToBoxAdapter(child: _buildMyUpcomingAcara(myUpcoming)),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Acara Mendatang (Global) ─────────────────────
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Acara Mendatang (Global)',
                actionLabel: 'Lihat Semua',
                onAction: () => MainScreen.of(context)?.setIndex(1),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            SliverToBoxAdapter(child: _buildGlobalUpcomingAcara(globalUpcoming)),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Kalender Latihan ─────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Kalender Latihan',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.neutral800,
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ChoirCalendar(practices: allPractices),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _quickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.neutral200),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.neutral700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingLatihan() {
    final provider = context.watch<LatihanProvider>();
    if (provider.isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: List.generate(
            2,
            (_) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: LoadingShimmer(height: 80),
            ),
          ),
        ),
      );
    }
    final list = provider.upcomingLatihan;
    if (list.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20),
        child: EmptyState(
          emoji: '🎵',
          title: 'Belum ada jadwal',
          subtitle: 'Jadwal latihan mendatang akan muncul di sini',
          isMini: true,
        ),
      );
    }
    return Column(
      children: list.map((l) => _latihanCard(l)).toList(),
    );
  }

  Widget _latihanCard(LatihanModel l) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      child: AppCard(
        onTap: () => Navigator.pushNamed(context, AppRoutes.latihanDetail, arguments: l),
        child: Row(
          children: [
            // Date block
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.primary50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary100),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    formatDayMonth(l.tanggal),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary500,
                      height: 1,
                    ),
                  ),
                  Text(
                    formatMonth(l.tanggal),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary300,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.tipeDisplay,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.neutral800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 13, color: AppColors.neutral400),
                      const SizedBox(width: 4),
                      Text(
                        l.jam.length >= 5 ? l.jam.substring(0, 5) : l.jam,
                        style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                      ),
                      const SizedBox(width: 12),
                      const Icon(Icons.location_on_outlined, size: 13, color: AppColors.neutral400),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          l.lokasi,
                          style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            StatusBadge.fromStatus(l.tipeLatihan),
          ],
        ),
      ),
    );
  }

  Widget _buildMyUpcomingAcara(AcaraModel? acara) {
    if (acara == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20),
        child: EmptyState(
          emoji: '🎭',
          title: 'Belum ada acara',
          subtitle: 'Acara mendatang yang Anda ikuti akan muncul di sini',
          isMini: true,
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: _homeAcaraCard(acara),
    );
  }

  Widget _buildGlobalUpcomingAcara(AcaraModel? acara) {
    if (acara == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20),
        child: EmptyState(
          emoji: '🎭',
          title: 'Belum ada acara aktif',
          subtitle: 'Acara aktif mendatang akan muncul di sini',
          isMini: true,
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: _homeAcaraCard(acara),
    );
  }

  Widget _homeAcaraCard(AcaraModel acara) {
    return AppCard(
      padding: EdgeInsets.zero,
      onTap: () => Navigator.pushNamed(context, AppRoutes.eventDetail, arguments: acara),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 6,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              color: AppColors.primary400,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        acara.namaAcara,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusBadge.fromStatus(acara.status),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 13, color: AppColors.neutral400),
                    const SizedBox(width: 6),
                    Text(
                      formatDate(acara.tanggal, withDay: true),
                      style: const TextStyle(fontSize: 13, color: AppColors.neutral600),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppColors.neutral400),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        acara.lokasi,
                        style: const TextStyle(fontSize: 13, color: AppColors.neutral600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Custom Month Calendar Widget ─────────────────────────────────────────────
class ChoirCalendar extends StatefulWidget {
  final List<LatihanModel> practices;
  const ChoirCalendar({super.key, required this.practices});

  @override
  State<ChoirCalendar> createState() => _ChoirCalendarState();
}

class _ChoirCalendarState extends State<ChoirCalendar> {
  late DateTime _focusedMonth;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _focusedMonth = DateTime(now.year, now.month, 1);
  }

  void _prevMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final weekDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

    final totalDays = DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final firstDay = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final offset = firstDay.weekday % 7; // Sunday=0, Mon=1...

    final monthName = _getMonthName(_focusedMonth.month);
    final year = _focusedMonth.year;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, color: AppColors.neutral600),
                onPressed: _prevMonth,
              ),
              Text(
                '$monthName $year',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral800,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right, color: AppColors.neutral600),
                onPressed: _nextMonth,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: weekDays.map((d) {
              return SizedBox(
                width: 32,
                child: Center(
                  child: Text(
                    d,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.neutral400,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1,
            ),
            itemCount: offset + totalDays,
            itemBuilder: (context, index) {
              if (index < offset) {
                return const SizedBox.shrink();
              }
              final day = index - offset + 1;
              final date = DateTime(_focusedMonth.year, _focusedMonth.month, day);
              final isToday = date.isAtSameMomentAs(today);

              final dayPractices = widget.practices.where((p) {
                final pDate = p.tanggalAsDate;
                if (pDate == null) return false;
                return pDate.year == date.year &&
                    pDate.month == date.month &&
                    pDate.day == date.day;
              }).toList();

              final hasPractices = dayPractices.isNotEmpty;

              return GestureDetector(
                onTapDown: hasPractices
                    ? (details) => _showCalendarDayPopup(context, details.globalPosition, date, dayPractices)
                    : null,
                child: Container(
                  decoration: BoxDecoration(
                    color: isToday ? AppColors.primary100 : Colors.transparent,
                    shape: BoxShape.circle,
                    border: isToday ? Border.all(color: AppColors.primary400, width: 1.5) : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$day',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isToday || hasPractices ? FontWeight.w700 : FontWeight.w400,
                          color: isToday
                              ? AppColors.primary600
                              : (hasPractices ? AppColors.neutral800 : AppColors.neutral700),
                        ),
                      ),
                      if (hasPractices) ...[
                        const SizedBox(height: 2),
                        Container(
                          width: 4,
                          height: 4,
                          decoration: const BoxDecoration(
                            color: AppColors.primary500,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showCalendarDayPopup(
    BuildContext context,
    Offset tapPosition,
    DateTime date,
    List<LatihanModel> practices,
  ) {
    final size = MediaQuery.of(context).size;
    double popupWidth = 240;
    double popupHeight = 56.0 + (practices.length * 56.0);
    if (popupHeight > 240) popupHeight = 240;

    double left = tapPosition.dx - (popupWidth / 2);
    double top = tapPosition.dy + 12;

    if (left < 16) left = 16;
    if (left + popupWidth > size.width - 16) left = size.width - popupWidth - 16;
    if (top + popupHeight > size.height - 16) {
      top = tapPosition.dy - popupHeight - 12;
    }

    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.05),
      builder: (context) {
        return Stack(
          children: [
            Positioned(
              left: left,
              top: top,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  width: popupWidth,
                  height: popupHeight,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    border: Border.all(color: AppColors.neutral200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                        child: Text(
                          'Latihan: ${date.day} ${_getMonthName(date.month)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.neutral400,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const Divider(height: 1, color: AppColors.neutral200),
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: practices.length,
                          itemBuilder: (context, i) {
                            final p = practices[i];
                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                                  dense: true,
                                  title: Text(
                                    p.tipeDisplay,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: AppColors.neutral800,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${p.jam.length >= 5 ? p.jam.substring(0, 5) : p.jam} | ${p.lokasi}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.neutral500,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  leading: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: p.isRutin ? AppColors.primary400 : AppColors.sopran,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                                if (i < practices.length - 1)
                                  const Divider(height: 1, color: AppColors.neutral100),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  String _getMonthName(int month) {
    const names = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    if (month >= 1 && month <= 12) return names[month - 1];
    return '';
  }
}
