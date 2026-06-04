import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _alamatCtrl = TextEditingController();
  final _kontakCtrl = TextEditingController();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _alamatCtrl.text = user?.alamat ?? '';
    _kontakCtrl.text = user?.kontak ?? '';
  }

  @override
  void dispose() {
    _alamatCtrl.dispose();
    _kontakCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final user = context.read<AuthProvider>().user;

    await context.read<AuthProvider>().updateProfile(
          alamat: _alamatCtrl.text.trim(),
          kontak: _kontakCtrl.text.trim(),
          jurusan: user?.jurusan,
          tanggalLahir: user?.tanggalLahir,
        );

    if (!mounted) return;
    setState(() => _loading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Profil berhasil diperbarui!'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Edit Profil', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: AppColors.primary700,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Read-only info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primary100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'INFORMASI TETAP',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.neutral400, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 12),
                    _readonlyRow('Nama Lengkap', user?.namaLengkap ?? '-'),
                    const SizedBox(height: 8),
                    _readonlyRow('NRP', user?.nrp ?? '-'),
                    const SizedBox(height: 8),
                    _readonlyRow('Email', user?.email ?? '-'),
                    const SizedBox(height: 8),
                    _readonlyRow('Bagian Suara', user?.bagianSuaraDisplay ?? '-'),
                    const SizedBox(height: 8),
                    _readonlyRow('Jurusan', user?.jurusan ?? '-'),
                    const SizedBox(height: 8),
                    _readonlyRow('Tanggal Lahir', user?.tanggalLahir != null ? user!.tanggalLahir!.split('T')[0] : '-'),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'INFORMASI YANG DAPAT DIUBAH',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.neutral400, letterSpacing: 0.8),
              ),
              const SizedBox(height: 14),

              // Alamat
              _buildLabel('Alamat'),
              TextFormField(
                controller: _alamatCtrl,
                maxLines: 3,
                decoration: _dec('Masukkan alamat lengkap...', Icons.home_outlined),
              ),
              const SizedBox(height: 16),

              // Kontak
              _buildLabel('Nomor Kontak / WhatsApp'),
              TextFormField(
                controller: _kontakCtrl,
                keyboardType: TextInputType.phone,
                decoration: _dec('Contoh: 08123456789', Icons.phone_outlined),
                validator: (v) {
                  if (v != null && v.isNotEmpty && v.length < 10) {
                    return 'Nomor kontak minimal 10 digit';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Save button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary400,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text(
                          'Simpan Perubahan',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _readonlyRow(String label, String value) {
    return Row(
      children: [
        SizedBox(
          width: 110,
          child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.neutral400, fontWeight: FontWeight.w500)),
        ),
        Text(': ', style: const TextStyle(color: AppColors.neutral300)),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.neutral700)),
    );
  }

  InputDecoration _dec(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: AppColors.neutral400, size: 20),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.neutral200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.neutral200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary400, width: 2)),
    );
  }
}
