import 'dart:io' show Platform;
import 'dart:convert' show jsonDecode;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class ScanQrScreen extends StatefulWidget {
  const ScanQrScreen({super.key});

  @override
  State<ScanQrScreen> createState() => _ScanQrScreenState();
}

class _ScanQrScreenState extends State<ScanQrScreen>
    with SingleTickerProviderStateMixin {
  MobileScannerController? _cameraCtrl;
  bool _isProcessing = false;
  bool _flashOn = false;
  String? _resultMsg;
  bool? _resultSuccess;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;
  
  // Simulator controller for desktop builds
  final TextEditingController _tokenInputCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    
    // Gracefully check for desktop platform to prevent mobile_scanner crash
    final bool isDesktop = !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);
    if (!isDesktop) {
      _cameraCtrl = MobileScannerController(
        detectionSpeed: DetectionSpeed.noDuplicates,
        facing: CameraFacing.back,
      );
    }

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _cameraCtrl?.dispose();
    _pulseCtrl.dispose();
    _tokenInputCtrl.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    final code = capture.barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;
    await _processScan(code);
  }

  Future<void> _processScan(String code) async {
    if (_isProcessing || _resultMsg != null) return;
    if (code.isEmpty) return;

    setState(() => _isProcessing = true);
    try {
      _cameraCtrl?.stop();
    } catch (_) {}

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    String qrToken = code;
    try {
      final decoded = jsonDecode(code);
      if (decoded is Map && decoded.containsKey('token')) {
        qrToken = decoded['token'].toString();
      }
    } catch (_) {
      // Fallback to raw code
    }

    final result = await ApiService().post('/absensi/scan', {
      'qr_token': qrToken,
      'anggota_id': user.id,
    });

    if (!mounted) return;
    setState(() {
      _isProcessing = false;
      _resultSuccess = result['success'] == true;
      _resultMsg = result['message'] ??
          (_resultSuccess! ? 'Absensi berhasil dicatat!' : 'Gagal melakukan absensi.');
    });

    // Auto close after 2 seconds on success
    if (_resultSuccess!) {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) Navigator.pop(context);
    }
  }

  void _retry() {
    setState(() {
      _resultMsg = null;
      _resultSuccess = null;
    });
    
    final bool isDesktop = !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);
    if (!isDesktop) {
      _cameraCtrl?.start();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera viewport or Mock Desktop Gradient Background
          if (_resultMsg == null)
            isDesktop
                ? Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [AppColors.primary900, Colors.black],
                      ),
                    ),
                  )
                : MobileScanner(
                    controller: _cameraCtrl!,
                    onDetect: _onDetect,
                  ),

          // Result Overlay Screen (Success/Error feedback)
          if (_resultMsg != null)
            _buildResultOverlay(),

          // Top Controls (Back Button, Flash Toggle)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _circleBtn(Icons.arrow_back_ios_new, () => Navigator.pop(context)),
                  const Spacer(),
                  if (_resultMsg == null && !isDesktop)
                    _circleBtn(
                      _flashOn ? Icons.flash_on : Icons.flash_off,
                      () {
                        setState(() => _flashOn = !_flashOn);
                        _cameraCtrl?.toggleTorch();
                      },
                    ),
                ],
              ),
            ),
          ),

          // Scanner Frame or Desktop Simulator Interface
          if (_resultMsg == null)
            Center(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      isDesktop ? 'Absensi QR Simulator (Mode Desktop)' : 'Scan QR Absensi',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        isDesktop
                            ? 'Simulasi absensi QR Code pada platform non-mobile untuk kebutuhan pengujian.'
                            : 'Arahkan kamera ke QR Code yang ditampilkan admin',
                        style: const TextStyle(color: Colors.white60, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (isDesktop) ...[
                      // Desktop Input Simulation Panel
                      Container(
                        width: 320,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.12)),
                        ),
                        child: Column(
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.terminal_rounded, color: AppColors.primary300, size: 16),
                                SizedBox(width: 8),
                                Text(
                                  'Masukkan Token QR Latihan',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _tokenInputCtrl,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'Salin token dari halaman absensi admin...',
                                hintStyle: const TextStyle(color: Colors.white30, fontSize: 11),
                                fillColor: Colors.black38,
                                filled: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              height: 44,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  _processScan(_tokenInputCtrl.text.trim());
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary400,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                icon: const Icon(Icons.send_rounded, size: 14),
                                label: const Text(
                                  'Kirim Absensi',
                                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else
                      // Mobile Animated Scanning Bounding Box
                      ScaleTransition(
                        scale: _pulseAnim,
                        child: Container(
                          width: 260,
                          height: 260,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.primary300, width: 3),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Stack(
                            children: [
                              _corner(Alignment.topLeft),
                              _corner(Alignment.topRight),
                              _corner(Alignment.bottomLeft),
                              _corner(Alignment.bottomRight),
                              if (_isProcessing)
                                const Center(
                                  child: CircularProgressIndicator(
                                    color: AppColors.primary300,
                                  ),
                                ),
                            ],
                          ),
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

  Widget _buildResultOverlay() {
    final success = _resultSuccess!;
    return Container(
      color: success ? AppColors.success.withOpacity(0.95) : AppColors.danger.withOpacity(0.95),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    success ? Icons.check_circle_outline : Icons.error_outline,
                    color: Colors.white,
                    size: 60,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  success ? 'Absensi Berhasil!' : 'Absensi Gagal',
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _resultMsg!,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Colors.white,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                if (!success) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _retry,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.danger,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Coba Lagi',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Kembali',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                ] else
                  const CircularProgressIndicator(color: Colors.white),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _corner(Alignment alignment) {
    const size = 24.0;
    const thickness = 4.0;
    final isTop = alignment == Alignment.topLeft || alignment == Alignment.topRight;
    final isLeft = alignment == Alignment.topLeft || alignment == Alignment.bottomLeft;

    return Positioned(
      top: isTop ? -1 : null,
      bottom: !isTop ? -1 : null,
      left: isLeft ? -1 : null,
      right: !isLeft ? -1 : null,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          border: Border(
            top: isTop ? const BorderSide(color: Colors.white, width: thickness) : BorderSide.none,
            bottom: !isTop ? const BorderSide(color: Colors.white, width: thickness) : BorderSide.none,
            left: isLeft ? const BorderSide(color: Colors.white, width: thickness) : BorderSide.none,
            right: !isLeft ? const BorderSide(color: Colors.white, width: thickness) : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
