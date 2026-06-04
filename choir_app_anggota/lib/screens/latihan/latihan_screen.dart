import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/routes.dart';
import '../../providers/latihan_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class LatihanScreen extends StatefulWidget {
  const LatihanScreen({super.key});

  @override
  State<LatihanScreen> createState() => _LatihanScreenState();
}

class _LatihanScreenState extends State<LatihanScreen> {
  String _selectedFilter = 'Semua';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LatihanProvider>().fetchAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LatihanProvider>();

    final uniqueAcara = <String>{};
    for (final l in provider.latihanList) {
      if (l.namaAcara != null && l.namaAcara!.isNotEmpty) {
        uniqueAcara.add(l.namaAcara!);
      }
    }

    final filteredList = provider.latihanList.where((l) {
      if (_selectedFilter == 'Semua') {
        return true;
      } else if (_selectedFilter == 'Reguler') {
        return l.isRutin;
      } else {
        return l.namaAcara == _selectedFilter;
      }
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 100,
            floating: true,
            snap: true,
            pinned: false,
            automaticallyImplyLeading: false,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              title: const Text(
                'Jadwal Latihan',
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
          ),

          // ── Filter Dropdown ────────────────────────────────
          if (!provider.isLoading && provider.latihanList.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.neutral200, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedFilter,
                      isExpanded: true,
                      icon: const Icon(Icons.arrow_drop_down, color: AppColors.neutral500),
                      dropdownColor: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      items: [
                        const DropdownMenuItem(
                          value: 'Semua',
                          child: Row(
                            children: [
                              Icon(Icons.tune_rounded, size: 18, color: AppColors.primary500),
                              SizedBox(width: 10),
                              Text('Semua Latihan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
                            ],
                          ),
                        ),
                        const DropdownMenuItem(
                          value: 'Reguler',
                          child: Row(
                            children: [
                              Icon(Icons.sync_rounded, size: 18, color: AppColors.primary500),
                              SizedBox(width: 10),
                              Text('Latihan Reguler', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
                            ],
                          ),
                        ),
                        ...uniqueAcara.map((acaraName) {
                          return DropdownMenuItem(
                            value: acaraName,
                            child: Row(
                              children: [
                                const Icon(Icons.event_note_rounded, size: 18, color: AppColors.primary500),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    acaraName,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral700),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedFilter = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
              ),
            ),

          if (provider.isLoading)
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: LoadingShimmer(height: 90),
                  ),
                  childCount: 6,
                ),
              ),
            )
          else if (filteredList.isEmpty)
            SliverFillRemaining(
              child: EmptyState(
                emoji: '🎵',
                title: provider.latihanList.isEmpty ? 'Belum ada jadwal' : 'Tidak ada latihan',
                subtitle: provider.latihanList.isEmpty
                    ? 'Jadwal latihan akan muncul di sini'
                    : 'Tidak ada latihan yang sesuai dengan filter ini',
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) {
                  final l = filteredList[i];
                  // Check if we need a month header
                  final showHeader = i == 0 ||
                      formatMonth(l.tanggal) !=
                          formatMonth(filteredList[i - 1].tanggal);

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (showHeader)
                        Padding(
                          padding: EdgeInsets.fromLTRB(20, i == 0 ? 20 : 8, 20, 8),
                          child: Text(
                             _monthYear(l.tanggal),
                             style: const TextStyle(
                               fontSize: 13,
                               fontWeight: FontWeight.w700,
                               color: AppColors.neutral500,
                               letterSpacing: 0.5,
                             ),
                           ),
                         ),
                       Padding(
                         padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                         child: AppCard(
                           onTap: () => Navigator.pushNamed(
                             context, AppRoutes.latihanDetail, arguments: l,
                           ),
                           child: Row(
                             children: [
                               // Date square
                               Container(
                                 width: 56,
                                 height: 56,
                                 decoration: BoxDecoration(
                                   gradient: LinearGradient(
                                     begin: Alignment.topLeft,
                                     end: Alignment.bottomRight,
                                     colors: l.isUpcoming
                                         ? [AppColors.primary500, AppColors.primary700]
                                         : [AppColors.neutral200, AppColors.neutral300],
                                   ),
                                   borderRadius: BorderRadius.circular(14),
                                 ),
                                 child: Column(
                                   mainAxisAlignment: MainAxisAlignment.center,
                                   children: [
                                     Text(
                                       formatDayMonth(l.tanggal),
                                       style: TextStyle(
                                         fontSize: 22,
                                         fontWeight: FontWeight.w900,
                                         color: l.isUpcoming ? Colors.white : AppColors.neutral500,
                                         height: 1,
                                       ),
                                     ),
                                     Text(
                                       formatMonth(l.tanggal),
                                       style: TextStyle(
                                         fontSize: 11,
                                         fontWeight: FontWeight.w600,
                                         color: l.isUpcoming
                                             ? Colors.white.withOpacity(0.8)
                                             : AppColors.neutral400,
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
                                     Row(
                                       children: [
                                         Expanded(
                                           child: Text(
                                             l.tipeDisplay,
                                             style: const TextStyle(
                                               fontSize: 15,
                                               fontWeight: FontWeight.w700,
                                               color: AppColors.neutral800,
                                             ),
                                           ),
                                         ),
                                         if (l.namaAcara != null)
                                           Container(
                                             padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                             decoration: BoxDecoration(
                                               color: AppColors.primary100,
                                               borderRadius: BorderRadius.circular(8),
                                             ),
                                             child: Text(
                                               'Acara',
                                               style: const TextStyle(
                                                 fontSize: 10,
                                                 fontWeight: FontWeight.w700,
                                                 color: AppColors.primary500,
                                               ),
                                             ),
                                           ),
                                       ],
                                     ),
                                     const SizedBox(height: 5),
                                     Row(
                                       children: [
                                         const Icon(Icons.schedule, size: 13, color: AppColors.neutral400),
                                         const SizedBox(width: 4),
                                         Text(l.jam, style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                                         const SizedBox(width: 12),
                                         const Icon(Icons.place_outlined, size: 13, color: AppColors.neutral400),
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
                                     if (l.keterangan != null && l.keterangan!.isNotEmpty) ...[
                                       const SizedBox(height: 4),
                                       Text(
                                         l.keterangan!,
                                         style: const TextStyle(fontSize: 12, color: AppColors.neutral400, fontStyle: FontStyle.italic),
                                         overflow: TextOverflow.ellipsis,
                                       ),
                                     ],
                                   ],
                                 ),
                               ),
                               const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.neutral300),
                             ],
                           ),
                         ),
                       ),
                     ],
                   );
                 },
                childCount: filteredList.length,
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  String _monthYear(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return '${months[dt.month - 1]} ${dt.year}'.toUpperCase();
    } catch (_) {
      return dateStr;
    }
  }
}
