import 'package:flutter/material.dart';
import '../../models/latihan_model.dart';
import '../../config/routes.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class LatihanDetailScreen extends StatelessWidget {
  final LatihanModel latihan;
  const LatihanDetailScreen({super.key, required this.latihan});

  @override
  Widget build(BuildContext context) {
    final l = latihan;
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppColors.primary700,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(56, 0, 20, 16),
              title: Text(
                l.tipeDisplay,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary900, AppColors.primary500],
                  ),
                ),
                child: const Center(child: Text('🎵', style: TextStyle(fontSize: 60))),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Main info card
                  AppCard(
                    child: Column(
                      children: [
                        _row(Icons.calendar_today_outlined, 'Tanggal',
                            formatDate(l.tanggal, withDay: true)),
                        const Divider(height: 20),
                        _row(Icons.schedule, 'Jam', '${l.jam} WIB'),
                        const Divider(height: 20),
                        _row(Icons.location_on_outlined, 'Lokasi', l.lokasi),
                        if (l.namaAcara != null) ...[
                          const Divider(height: 20),
                          _row(Icons.event_rounded, 'Untuk Acara', l.namaAcara!),
                        ],
                        if (l.keterangan != null && l.keterangan!.isNotEmpty) ...[
                          const Divider(height: 20),
                          _row(Icons.notes, 'Keterangan', l.keterangan!),
                        ],
                        const Divider(height: 20),
                        _row(Icons.notifications_active_outlined, 'Waktu Notifikasi Pengingat',
                            '${l.waktuNotifikasi} menit sebelum latihan'),
                        const Divider(height: 20),
                        _row(Icons.category_outlined, 'Tipe', l.tipeDisplay),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // QR Scan button (only for upcoming)
                  if (l.isUpcoming)
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.pushNamed(context, AppRoutes.scanQr),
                        icon: const Icon(Icons.qr_code_scanner_rounded),
                        label: const Text('Scan QR Absensi'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary500,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.neutral100,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.neutral200),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history_rounded, color: AppColors.neutral400, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Latihan sudah selesai',
                            style: TextStyle(color: AppColors.neutral400, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.primary400),
        const SizedBox(width: 12),
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
}
