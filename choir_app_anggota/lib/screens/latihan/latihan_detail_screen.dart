import 'package:flutter/material.dart';
import '../../models/latihan_model.dart';
import '../../config/routes.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';

class LatihanDetailScreen extends StatelessWidget {
  final LatihanModel latihan;
  const LatihanDetailScreen({super.key, required this.latihan});

  /// Buka formulir pengajuan izin/sakit untuk latihan ini.
  Future<void> _ajukanIzin(BuildContext context) async {
    final hasil = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FormIzin(latihanId: latihan.id),
    );

    if (hasil != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(hasil), backgroundColor: AppColors.success),
      );
    }
  }

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
                    Column(
                      children: [
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
                        ),
                        const SizedBox(height: 10),
                        // Berhalangan hadir tidak lagi perlu japri pengurus.
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: OutlinedButton.icon(
                            onPressed: () => _ajukanIzin(context),
                            icon: const Icon(Icons.event_busy_rounded, size: 20),
                            label: const Text('Ajukan Izin / Sakit'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary600,
                              side: const BorderSide(color: AppColors.primary200),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                        ),
                      ],
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

/// Formulir pengajuan izin atau sakit untuk sebuah latihan.
///
/// Hanya untuk latihan yang belum lewat — server menolak pengajuan mundur
/// agar anggota tidak bisa mengubah 'alpha' miliknya sendiri menjadi 'izin'.
class _FormIzin extends StatefulWidget {
  final int latihanId;
  const _FormIzin({required this.latihanId});

  @override
  State<_FormIzin> createState() => _FormIzinState();
}

class _FormIzinState extends State<_FormIzin> {
  final _alasan = TextEditingController();
  String _status = 'izin';
  bool _mengirim = false;
  String? _galat;

  @override
  void dispose() {
    _alasan.dispose();
    super.dispose();
  }

  Future<void> _kirim() async {
    setState(() {
      _mengirim = true;
      _galat = null;
    });
    try {
      final res = await ApiService().post('/absensi/izin', {
        'latihan_id': widget.latihanId,
        'status': _status,
        'keterangan': _alasan.text.trim().isEmpty ? null : _alasan.text.trim(),
      });
      if (res['success'] == true) {
        if (mounted) Navigator.pop(context, 'Pengajuan ${_status == 'izin' ? 'izin' : 'sakit'} terkirim.');
        return;
      }
      setState(() => _galat = res['message']?.toString() ?? 'Gagal mengirim pengajuan.');
    } catch (e) {
      setState(() => _galat = 'Gagal mengirim pengajuan. Periksa koneksi Anda.');
    } finally {
      if (mounted) setState(() => _mengirim = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.neutral200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Ajukan Izin / Sakit',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.neutral800),
            ),
            const SizedBox(height: 4),
            const Text(
              'Pengurus akan melihat pengajuan ini pada daftar absensi.',
              style: TextStyle(fontSize: 13, color: AppColors.neutral500),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(child: _pilihan('izin', 'Izin', Icons.event_busy_rounded)),
                const SizedBox(width: 10),
                Expanded(child: _pilihan('sakit', 'Sakit', Icons.healing_rounded)),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _alasan,
              maxLength: 255,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Alasan (opsional)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.all(14),
              ),
            ),
            if (_galat != null) ...[
              const SizedBox(height: 4),
              Text(_galat!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _mengirim ? null : _kirim,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _mengirim
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Kirim Pengajuan'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pilihan(String nilai, String label, IconData ikon) {
    final aktif = _status == nilai;
    return InkWell(
      onTap: () => setState(() => _status = nilai),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: aktif ? AppColors.primary50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: aktif ? AppColors.primary400 : AppColors.neutral200),
        ),
        child: Column(
          children: [
            Icon(ikon, size: 22, color: aktif ? AppColors.primary600 : AppColors.neutral400),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: aktif ? FontWeight.w700 : FontWeight.w500,
                color: aktif ? AppColors.primary600 : AppColors.neutral600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
