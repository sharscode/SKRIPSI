import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../models/partitur_model.dart';
import '../../config/routes.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class PartiturListScreen extends StatefulWidget {
  const PartiturListScreen({super.key});

  @override
  State<PartiturListScreen> createState() => _PartiturListScreenState();
}

class _PartiturListScreenState extends State<PartiturListScreen> {
  final _api = ApiService();
  List<PartiturModel> _all = [];
  List<PartiturModel> _filtered = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  String _selectedJenis = '';

  final _jenisList = ['', 'Hymn', 'Klasik', 'Oratorio', 'Pop', 'Rohani', 'Nasional', 'Lainnya'];

  @override
  void initState() {
    super.initState();
    _fetchPartitur();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchPartitur() async {
    setState(() => _loading = true);
    final result = await _api.get('/partitur');
    if (!mounted) return;
    if (result['success'] == true) {
      final list = (result['data'] as List<dynamic>? ?? []);
      _all = list.map((e) => PartiturModel.fromJson(e as Map<String, dynamic>)).toList();
      _applyFilter();
    }
    setState(() => _loading = false);
  }

  void _applyFilter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = _all.where((p) {
        final matchSearch = q.isEmpty ||
            p.judul.toLowerCase().contains(q) ||
            p.komposer.toLowerCase().contains(q);
        final matchJenis = _selectedJenis.isEmpty || p.jenisLagu == _selectedJenis;
        return matchSearch && matchJenis;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 110,
            floating: true,
            snap: true,
            pinned: false,
            automaticallyImplyLeading: false,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              title: const Text(
                'Koleksi Partitur',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
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
          ),

          // Search + Filter bar
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                children: [
                  TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => _applyFilter(),
                    decoration: InputDecoration(
                      hintText: 'Cari judul atau komposer...',
                      prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.neutral400),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                _applyFilter();
                              },
                            )
                          : null,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      filled: true,
                      fillColor: AppColors.neutral50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.neutral200),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.neutral200),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primary400, width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Jenis chips
                  SizedBox(
                    height: 34,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _jenisList.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (_, i) {
                        final j = _jenisList[i];
                        final selected = _selectedJenis == j;
                        return GestureDetector(
                          onTap: () {
                            setState(() => _selectedJenis = j);
                            _applyFilter();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary400 : AppColors.neutral100,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              j.isEmpty ? 'Semua' : j,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: selected ? Colors.white : AppColors.neutral600,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_loading)
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => LoadingShimmer(height: 160),
                  childCount: 6,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
              ),
            )
          else if (_filtered.isEmpty)
            const SliverFillRemaining(
              child: EmptyState(
                emoji: '🎼',
                title: 'Partitur tidak ditemukan',
                subtitle: 'Coba ubah kata kunci atau filter jenis lagu',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _PartiturCard(partitur: _filtered[i]),
                  childCount: _filtered.length,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PartiturCard extends StatelessWidget {
  final PartiturModel partitur;
  const _PartiturCard({required this.partitur});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.partiturView,
        arguments: partitur,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Music note header
          Container(
            height: 100,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  _jenisColor(partitur.jenisLagu),
                  _jenisColor(partitur.jenisLagu).withOpacity(0.7),
                ],
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Text(
                    _jenisEmoji(partitur.jenisLagu),
                    style: const TextStyle(fontSize: 40),
                  ),
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${partitur.jumlahSuara} Suara',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    partitur.judul,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.neutral800,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    partitur.komposer,
                    style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _jenisColor(partitur.jenisLagu).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          partitur.jenisLagu,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _jenisColor(partitur.jenisLagu),
                          ),
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.picture_as_pdf, size: 14, color: AppColors.danger),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _jenisColor(String jenis) {
    switch (jenis.toLowerCase()) {
      case 'hymn': return AppColors.sopran;
      case 'klasik': return AppColors.primary500;
      case 'oratorio': return AppColors.primary700;
      case 'pop': return const Color(0xFFEC4899);
      case 'rohani': return AppColors.alto;
      case 'nasional': return AppColors.warning;
      default: return AppColors.neutral500;
    }
  }

  String _jenisEmoji(String jenis) {
    switch (jenis.toLowerCase()) {
      case 'hymn': return '⛪';
      case 'klasik': return '🎻';
      case 'oratorio': return '🎼';
      case 'pop': return '🎤';
      case 'rohani': return '✝️';
      case 'nasional': return '🏛️';
      default: return '🎶';
    }
  }
}
