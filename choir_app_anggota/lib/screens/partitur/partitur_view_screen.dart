import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/partitur_model.dart';
import '../../config/api_config.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class PartiturViewScreen extends StatelessWidget {
  final PartiturModel partitur;
  const PartiturViewScreen({super.key, required this.partitur});

  @override
  Widget build(BuildContext context) {
    final String rawPath = partitur.filePdf;
    final String pdfUrl = rawPath.startsWith('uploads/')
        ? '${ApiConfig.serverUrl}/$rawPath'
        : '${ApiConfig.uploadsUrl}/$rawPath';

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: Text(partitur.judul, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.primary700,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Info strip
          Container(
            color: AppColors.primary50,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        partitur.judul,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'oleh ${partitur.komposer}',
                        style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                      ),
                    ],
                  ),
                ),
                StatusBadge.fromStatus(partitur.jenisLagu),
              ],
            ),
          ),

          // PDF viewer area
          Expanded(
            child: Container(
              color: AppColors.neutral200,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.danger.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.picture_as_pdf,
                          color: AppColors.danger,
                          size: 40,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      partitur.judul,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.neutral700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${partitur.jumlahSuara} Suara • ${partitur.jenisLagu}',
                      style: const TextStyle(fontSize: 14, color: AppColors.neutral400),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      onPressed: () => _openInBrowser(context, pdfUrl),
                      icon: const Icon(Icons.open_in_new),
                      label: const Text('Buka PDF'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.danger,
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openInBrowser(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tidak dapat membuka file PDF.'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }
}
