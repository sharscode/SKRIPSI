import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final unread = context.watch<NotificationProvider>().unreadCount;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: CustomScrollView(
        slivers: [
          // Header
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
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  child: Column(
                    children: [
                      // Avatar
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.2),
                          border: Border.all(color: Colors.white.withOpacity(0.5), width: 3),
                        ),
                        child: Center(
                          child: Text(
                            user?.initials ?? '?',
                            style: const TextStyle(
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        user?.namaLengkap ?? 'Memuat...',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.nrp ?? '',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (user?.bagianSuara != null && user!.bagianSuara.isNotEmpty)
                            _chip(
                              '🎵 ${user.bagianSuaraDisplay}',
                              AppColors.voicePartColor(user.bagianSuara),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Info section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Account Info
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'INFORMASI AKUN',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.neutral400,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _infoRow(Icons.email_outlined, 'Email', user?.email ?? '-'),
                        const Divider(height: 20),
                        _infoRow(Icons.phone_outlined, 'Kontak', user?.kontak ?? '-'),
                        const Divider(height: 20),
                        _infoRow(Icons.home_outlined, 'Alamat', user?.alamat ?? '-'),
                        const Divider(height: 20),
                        _infoRow(Icons.school_outlined, 'Jurusan', user?.jurusan ?? '-'),
                        const Divider(height: 20),
                        _infoRow(Icons.cake_outlined, 'Tanggal Lahir', user?.tanggalLahir != null ? user!.tanggalLahir!.split('T')[0] : '-'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Menu items
                  AppCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      children: [
                        _menuItem(
                          context,
                          icon: Icons.edit_outlined,
                          label: 'Edit Profil',
                          onTap: () => Navigator.pushNamed(context, AppRoutes.editProfile),
                        ),
                        const Divider(height: 1, indent: 56),
                        _menuItem(
                          context,
                          icon: Icons.notifications_outlined,
                          label: 'Notifikasi',
                          badge: unread,
                          onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
                        ),
                        const Divider(height: 1, indent: 56),
                        _menuItem(
                          context,
                          icon: Icons.history_rounded,
                          label: 'Riwayat Absensi',
                          onTap: () => Navigator.pushNamed(context, AppRoutes.absensiHistory),
                        ),
                        const Divider(height: 1, indent: 56),
                        _menuItem(
                          context,
                          icon: Icons.qr_code_scanner_rounded,
                          label: 'Scan QR Absensi',
                          onTap: () => Navigator.pushNamed(context, AppRoutes.scanQr),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Logout
                  AppCard(
                    padding: EdgeInsets.zero,
                    child: _menuItem(
                      context,
                      icon: Icons.logout_rounded,
                      label: 'Keluar',
                      color: AppColors.danger,
                      onTap: () => _confirmLogout(context),
                    ),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
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
              Text(
                value.isEmpty ? '-' : value,
                style: const TextStyle(fontSize: 14, color: AppColors.neutral700, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _menuItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
    int badge = 0,
  }) {
    final effectiveColor = color ?? AppColors.neutral700;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: (color ?? AppColors.primary400).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color ?? AppColors.primary400),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: effectiveColor,
                ),
              ),
            ),
            if (badge > 0)
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.danger,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$badge',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
            Icon(Icons.arrow_forward_ios, size: 14, color: color?.withOpacity(0.5) ?? AppColors.neutral300),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Keluar', style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('Yakin ingin keluar dari akun ini?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AuthProvider>().logout().then((_) {
                Navigator.pushNamedAndRemoveUntil(
                  context, AppRoutes.login, (route) => false,
                );
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Keluar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
