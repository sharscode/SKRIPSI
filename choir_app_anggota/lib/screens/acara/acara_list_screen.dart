import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/routes.dart';
import '../../providers/acara_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';
import '../../models/acara_model.dart';

class AcaraListScreen extends StatefulWidget {
  const AcaraListScreen({super.key});

  @override
  State<AcaraListScreen> createState() => _AcaraListScreenState();
}

class _AcaraListScreenState extends State<AcaraListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _tabs = ['Aktif', 'Selesai'];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userId = context.read<AuthProvider>().user?.id;
      context.read<AcaraProvider>().fetchAll(userAnggotaId: userId);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            pinned: true,
            floating: true,
            snap: true,
            expandedHeight: 140,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 48),
              title: const Text(
                'Acaraku',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary800, AppColors.primary600],
                  ),
                ),
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: SizedBox(
                height: 48,
                child: TabBar(
                  controller: _tabCtrl,
                  tabs: _tabs.map((t) => Tab(text: t)).toList(),
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.white54,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  indicatorColor: Colors.white,
                  indicatorWeight: 2,
                  indicatorSize: TabBarIndicatorSize.label,
                ),
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabCtrl,
          children: const [
            _AcaraTabView(filter: 'aktif'),
            _AcaraTabView(filter: 'selesai'),
          ],
        ),
      ),
    );
  }
}

class _AcaraTabView extends StatelessWidget {
  final String filter;
  const _AcaraTabView({required this.filter});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AcaraProvider>();
    final myRegs = provider.myRegistrations;

    if (provider.isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        itemBuilder: (_, __) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: LoadingShimmer(height: 120),
        ),
      );
    }

    final myRegIds = myRegs
        .where((r) =>
            r.statusPeserta == 'ikut' &&
            (r.approvalStatus == 'disetujui' ||
                r.approvalStatus == 'approved'))
        .map((r) => r.acaraId)
        .toSet();

    final list = provider.acaraList.where((a) {
      if (a.status != filter) return false;
      return myRegIds.contains(a.id);
    }).toList();

    if (list.isEmpty) {
      return const EmptyState(
        emoji: '🎭',
        title: 'Belum ada acara',
        subtitle: 'Acara yang Anda ikuti akan ditampilkan di sini',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary400,
      onRefresh: () async {
        final userId = context.read<AuthProvider>().user?.id;
        await context.read<AcaraProvider>().fetchAll(userAnggotaId: userId);
      },
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: list.length,
        itemBuilder: (_, i) => _AcaraCard(acara: list[i]),
      ),
    );
  }
}

class _AcaraCard extends StatelessWidget {
  final AcaraModel acara;
  const _AcaraCard({required this.acara});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: EdgeInsets.zero,
        onTap: () => Navigator.pushNamed(
          context,
          AppRoutes.eventDetail,
          arguments: acara,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 6,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                color: acara.isAktif ? AppColors.primary400 : AppColors.neutral300,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                  _infoRow(Icons.category_outlined, acara.jenisKegiatan),
                  const SizedBox(height: 5),
                  _infoRow(Icons.calendar_today_outlined, formatDate(acara.tanggal, withDay: true)),
                  const SizedBox(height: 5),
                  _infoRow(Icons.location_on_outlined, acara.lokasi),
                  const Divider(height: 20),
                  Row(
                    children: [
                      _statChip(Icons.music_note_rounded, '${acara.jumlahLatihan} Latihan'),
                      const SizedBox(width: 8),
                      _statChip(Icons.badge_outlined, acara.jenisSkkk),
                      const Spacer(),
                      const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.neutral400),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.neutral400),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: AppColors.neutral600),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _statChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.neutral100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.neutral500),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.neutral600,
            ),
          ),
        ],
      ),
    );
  }
}
