import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/routes.dart';
import '../../models/acara_model.dart';
import '../../models/latihan_model.dart';
import '../../models/partitur_model.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/acara_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';
import '../../utils/helpers.dart';

class AcaraDetailScreen extends StatefulWidget {
  final AcaraModel acara;
  const AcaraDetailScreen({super.key, required this.acara});

  @override
  State<AcaraDetailScreen> createState() => _AcaraDetailScreenState();
}

class _AcaraDetailScreenState extends State<AcaraDetailScreen>
    with SingleTickerProviderStateMixin {
  final _api = ApiService();
  late TabController _tabCtrl;
  List<Map<String, dynamic>> _peserta = [];
  List<LatihanModel> _latihan = [];
  List<PartiturModel> _partiturList = [];
  bool _loading = true;
  String? _myStatus;       // approval_status for current user
  int? _myPesertaId;
  bool _registering = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  int _voicePartWeight(String part) {
    switch (part.toLowerCase()) {
      case 'sopran': return 1;
      case 'alto': return 2;
      case 'tenor': return 3;
      case 'bass': return 4;
      default: return 5;
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _loading = true;
      _myStatus = null;
      _myPesertaId = null;
    });
    final userId = context.read<AuthProvider>().user?.id;
    final acaraId = widget.acara.id;

    final results = await Future.wait([
      _api.get('/peserta-acara/acara/$acaraId'),
      _api.get('/latihan?acara_id=$acaraId'),
      _api.get('/partitur/acara/$acaraId'),
    ]);

    if (!mounted) return;

    final pesertaData = results[0];
    final latihanData = results[1];
    final partiturData = results[2];

    if (pesertaData['success'] == true) {
      final list = (pesertaData['data'] as List<dynamic>? ?? []);
      _peserta = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      
      // Sort: Sopran -> Alto -> Tenor -> Bass, then A-Z by nama_lengkap
      _peserta.sort((a, b) {
        final valA = _voicePartWeight(a['bagian_suara']?.toString() ?? '');
        final valB = _voicePartWeight(b['bagian_suara']?.toString() ?? '');
        if (valA != valB) {
          return valA.compareTo(valB);
        }
        final nameA = (a['nama_lengkap']?.toString() ?? '').toLowerCase();
        final nameB = (b['nama_lengkap']?.toString() ?? '').toLowerCase();
        return nameA.compareTo(nameB);
      });

      // Check if current user is a participant
      if (userId != null) {
        final myEntry = _peserta.where((p) => p['anggota_id'] == userId).firstOrNull;
        if (myEntry != null) {
          _myStatus = myEntry['approval_status']?.toString();
          _myPesertaId = myEntry['id'] as int?;
        }
      }
    }

    if (latihanData['success'] == true) {
      final list = (latihanData['data'] as List<dynamic>? ?? []);
      _latihan = list.map((e) => LatihanModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }

    if (partiturData['success'] == true) {
      final list = (partiturData['data'] as List<dynamic>? ?? []);
      _partiturList = list.map((e) => PartiturModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }

    setState(() => _loading = false);
  }

  Future<void> _register() async {
    setState(() => _registering = true);
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;

    final result = await _api.post('/peserta-acara', {
      'acara_id': widget.acara.id,
      'anggota_id': userId,
    });

    if (!mounted) return;
    setState(() => _registering = false);

    if (result['success'] == true) {
      _showSnack('Berhasil mendaftar! Menunggu persetujuan admin.', success: true);
      
      // Also refresh the provider to update registration list
      context.read<AcaraProvider>().fetchAll(userAnggotaId: userId);
      
      _fetchData();
    } else {
      _showSnack(result['message'] ?? 'Gagal mendaftar.', success: false);
    }
  }

  Future<void> _confirmAndRegister() async {
    final confirmed = await Helpers.showConfirmDialog(
      context,
      title: 'Konfirmasi Join',
      message: 'Apakah Anda yakin ingin bergabung dengan acara "${widget.acara.namaAcara}"?',
      confirmText: 'Ya, Join',
      cancelText: 'Batal',
    );
    if (confirmed == true) {
      _register();
    }
  }

  void _showSnack(String msg, {required bool success}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: success ? AppColors.success : AppColors.danger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final acara = widget.acara;
    final isApproved = _myStatus == 'disetujui';

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 110,
            pinned: true,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            actions: const [],
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(56, 0, 56, 16),
              title: Text(
                acara.namaAcara,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary900, AppColors.primary600],
                  ),
                ),
              ),
            ),
          ),

          // ── Registration status banner ─────────────────────
          if (_myStatus != null && _myStatus != 'disetujui')
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _statusColor(_myStatus!).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _statusColor(_myStatus!).withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(_statusIcon(_myStatus!), color: _statusColor(_myStatus!), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _statusMessage(_myStatus!),
                        style: TextStyle(
                          color: _statusColor(_myStatus!),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ── Info Cards ────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                (_myStatus != null && _myStatus != 'disetujui') ? 8 : 30,
                16,
                16,
              ),
              child: AppCard(
                child: Column(
                  children: [
                    _infoRow(Icons.event_rounded, 'Tanggal', formatDate(acara.tanggal, withDay: true)),
                    const Divider(height: 20),
                    _infoRow(Icons.location_on_outlined, 'Lokasi', acara.lokasi),
                    const Divider(height: 20),
                    _infoRow(Icons.category_outlined, 'Jenis Kegiatan', acara.jenisKegiatan),
                    const Divider(height: 20),
                    _infoRow(Icons.business_outlined, 'Penyelenggara', acara.penyelenggara),
                    const Divider(height: 20),
                    _infoRow(Icons.person_outlined, 'Penanggung Jawab', acara.penanggungJawab),
                    const Divider(height: 20),
                    _infoRow(Icons.workspace_premium_outlined, 'Jenis SKKK', acara.jenisSkkk),
                    if (isApproved) ...[
                      const Divider(height: 20),
                      ElevatedButton.icon(
                        onPressed: _showDokumentasi,
                        icon: const Icon(Icons.photo_library_outlined, size: 18),
                        label: const Text('Dokumentasi'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary50,
                          foregroundColor: AppColors.primary700,
                          elevation: 0,
                          minimumSize: const Size.fromHeight(44),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),

          // ── Tabs (Shown only for approved participants) ─────────────────
          if (isApproved) ...[
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                TabBar(
                  controller: _tabCtrl,
                  labelColor: AppColors.primary500,
                  unselectedLabelColor: AppColors.neutral400,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  indicatorColor: AppColors.primary400,
                  indicatorWeight: 3,
                  tabs: [
                    Tab(text: 'Latihan (${_latihan.length})'),
                    Tab(text: 'Partitur (${_partiturList.length})'),
                    Tab(text: 'Peserta (${_peserta.length})'),
                  ],
                ),
              ),
            ),
            SliverFillRemaining(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary400))
                  : TabBarView(
                      controller: _tabCtrl,
                      children: [
                        _buildLatihanTab(),
                        _buildPartiturTab(),
                        _buildPesertaTab(),
                      ],
                    ),
            ),
          ] else ...[
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ],
      ),
      bottomNavigationBar: _myStatus == null && !_loading
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: ElevatedButton(
                  onPressed: _registering ? null : _confirmAndRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _registering
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'Join',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildLatihanTab() {
    if (_latihan.isEmpty) {
      return const EmptyState(
        emoji: '🎵',
        title: 'Belum ada jadwal latihan',
        subtitle: 'Jadwal latihan untuk acara ini akan ditampilkan di sini',
      );
    }

    // Sort from oldest to newest based on date string YYYY-MM-DD
    final sortedLatihan = List<LatihanModel>.from(_latihan);
    sortedLatihan.sort((a, b) => a.tanggal.compareTo(b.tanggal));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sortedLatihan.length,
      itemBuilder: (_, i) {
        final l = sortedLatihan[i];
        final formattedDate = formatDate(l.tanggal, withDay: false);

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: AppCard(
            onTap: () => Navigator.pushNamed(context, AppRoutes.latihanDetail, arguments: l),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary500,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$formattedDate · ${l.jam} WIB',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l.lokasi,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.neutral500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.neutral400),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPesertaTab() {
    if (_peserta.isEmpty) {
      return const EmptyState(
        emoji: '👥',
        title: 'Belum ada peserta',
        subtitle: 'Daftar peserta yang telah mendaftar akan muncul di sini',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _peserta.length,
      itemBuilder: (_, i) {
        final p = _peserta[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.voicePartColor(p['bagian_suara']?.toString() ?? '').withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      (p['nama_lengkap']?.toString() ?? '?').isNotEmpty
                          ? (p['nama_lengkap']?.toString() ?? '?')[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.voicePartColor(p['bagian_suara']?.toString() ?? ''),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p['nama_lengkap']?.toString() ?? '-',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral800),
                      ),
                      Text(
                        p['nrp']?.toString() ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: AppColors.neutral400),
                      ),
                    ],
                  ),
                ),
                StatusBadge.fromStatus(p['bagian_suara']?.toString() ?? ''),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPartiturTab() {
    if (_partiturList.isEmpty) {
      return const EmptyState(
        emoji: '🎵',
        title: 'Belum ada partitur',
        subtitle: 'Koleksi partitur untuk acara ini akan ditampilkan di sini',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _partiturList.length,
      itemBuilder: (_, i) {
        final p = _partiturList[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: AppCard(
            onTap: () {
              Navigator.pushNamed(
                context,
                AppRoutes.partiturView,
                arguments: p,
              );
            },
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.danger.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.picture_as_pdf,
                      color: AppColors.danger,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.judul,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        p.komposer,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.neutral500,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.neutral400),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showDokumentasi() async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _DokumentasiSheet(
          acaraId: widget.acara.id,
          namaAcara: widget.acara.namaAcara,
        );
      },
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.primary400),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.neutral400, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(fontSize: 14, color: AppColors.neutral800, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'disetujui': return AppColors.success;
      case 'menunggu': return AppColors.warning;
      case 'ditolak': return AppColors.danger;
      default: return AppColors.neutral400;
    }
  }

  IconData _statusIcon(String s) {
    switch (s) {
      case 'disetujui': return Icons.check_circle_outline;
      case 'menunggu': return Icons.hourglass_empty;
      case 'ditolak': return Icons.cancel_outlined;
      default: return Icons.info_outline;
    }
  }

  String _statusMessage(String s) {
    switch (s) {
      case 'disetujui': return 'Kamu telah terdaftar sebagai peserta acara ini.';
      case 'menunggu': return 'Pendaftaranmu sedang menunggu persetujuan admin.';
      case 'ditolak': return 'Pendaftaranmu tidak disetujui oleh admin.';
      default: return '';
    }
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: tabBar,
    );
  }

  @override
  double get maxExtent => tabBar.preferredSize.height;
  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  bool shouldRebuild(_TabBarDelegate oldDelegate) => false;
}

class _DokumentasiSheet extends StatefulWidget {
  final int acaraId;
  final String namaAcara;
  const _DokumentasiSheet({required this.acaraId, required this.namaAcara});

  @override
  State<_DokumentasiSheet> createState() => _DokumentasiSheetState();
}

class _DokumentasiSheetState extends State<_DokumentasiSheet> {
  final ApiService _api = ApiService();
  bool _loading = true;
  List<dynamic> _photos = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDokumentasi();
  }

  Future<void> _fetchDokumentasi() async {
    try {
      final res = await _api.get('/dokumentasi/acara/${widget.acaraId}');
      if (res['success'] == true) {
        setState(() {
          _photos = res['data'] as List<dynamic>? ?? [];
          _loading = false;
        });
      } else {
        setState(() {
          _error = res['message']?.toString() ?? 'Gagal memuat dokumentasi.';
          _loading = false;
        });
      }
    } catch (_) {
      setState(() {
        _error = 'Koneksi gagal.';
        _loading = false;
      });
    }
  }

  void _showLargePhoto(String imgUrl, String caption) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: InteractiveViewer(
                  maxScale: 3.0,
                  child: Image.network(
                    imgUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Container(
                      padding: const EdgeInsets.all(24),
                      color: Colors.black54,
                      child: const Icon(Icons.broken_image, size: 64, color: Colors.white),
                    ),
                  ),
                ),
              ),
              if (caption.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    caption,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              IconButton(
                icon: const Icon(Icons.cancel, color: Colors.white, size: 36),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final sheetHeight = mediaQuery.size.height * 0.75;

    return Container(
      height: sheetHeight,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.neutral300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Dokumentasi Acara',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.neutral800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.namaAcara,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.neutral500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.neutral500),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 20),
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary400));
    }
    if (_error != null) {
      return Center(child: Text(_error!, style: const TextStyle(color: AppColors.danger)));
    }
    if (_photos.isEmpty) {
      return const EmptyState(
        emoji: '📸',
        title: 'Belum ada dokumentasi',
        subtitle: 'Foto-foto kegiatan belum diunggah untuk acara ini.',
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1,
      ),
      itemCount: _photos.length,
      itemBuilder: (context, index) {
        final photo = _photos[index];
        final String rawPath = photo['file_path']?.toString() ?? '';
        final String imgUrl = rawPath.startsWith('uploads/')
            ? '${ApiConfig.serverUrl}/$rawPath'
            : '${ApiConfig.uploadsUrl}/$rawPath';
        final String caption = photo['keterangan']?.toString() ?? '';

        return GestureDetector(
          onTap: () => _showLargePhoto(imgUrl, caption),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  imgUrl,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return Container(
                      color: AppColors.neutral100,
                      child: const Center(
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary300),
                      ),
                    );
                  },
                  errorBuilder: (_, __, ___) => Container(
                    color: AppColors.neutral200,
                    child: const Icon(Icons.broken_image, color: AppColors.neutral400),
                  ),
                ),
                if (caption.isNotEmpty)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.black.withOpacity(0.7),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(8, 16, 8, 6),
                      child: Text(
                        caption,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
