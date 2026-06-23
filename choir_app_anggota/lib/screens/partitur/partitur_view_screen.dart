import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../models/partitur_model.dart';
import '../../config/api_config.dart';
import '../../theme/app_colors.dart';
import '../../widgets/shared_widgets.dart';

class PartiturViewScreen extends StatefulWidget {
  final PartiturModel partitur;
  const PartiturViewScreen({super.key, required this.partitur});

  @override
  State<PartiturViewScreen> createState() => _PartiturViewScreenState();
}

class _PartiturViewScreenState extends State<PartiturViewScreen> {
  late final String pdfUrl;
  late final PdfViewerController _pdfViewerController;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _pdfViewerController = PdfViewerController();

    final String rawPath = widget.partitur.filePdf;
    pdfUrl = rawPath.startsWith('uploads/')
        ? '${ApiConfig.serverUrl}/$rawPath'
        : '${ApiConfig.uploadsUrl}/$rawPath';
  }

  @override
  void dispose() {
    _pdfViewerController.dispose();
    super.dispose();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: Text(widget.partitur.judul, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.primary700,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new, size: 20),
            tooltip: 'Buka di Browser',
            onPressed: () => _openInBrowser(context, pdfUrl),
          ),
        ],
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
                        widget.partitur.judul,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'oleh ${widget.partitur.komposer}',
                        style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                      ),
                    ],
                  ),
                ),
                StatusBadge.fromStatus(widget.partitur.jenisLagu),
              ],
            ),
          ),

          // PDF viewer area
          Expanded(
            child: Container(
              color: AppColors.neutral200,
              child: Stack(
                children: [
                  if (!_hasError)
                    SfPdfViewer.network(
                      pdfUrl,
                      controller: _pdfViewerController,
                      onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                        setState(() {
                          _isLoading = false;
                          _hasError = false;
                        });
                      },
                      onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
                        setState(() {
                          _isLoading = false;
                          _hasError = true;
                          _errorMessage = details.description;
                        });
                      },
                    ),

                  if (_isLoading && !_hasError)
                    const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary700),
                      ),
                    ),

                  if (_hasError)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
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
                                  Icons.error_outline,
                                  color: AppColors.danger,
                                  size: 40,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Gagal Memuat PDF',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.neutral700,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _errorMessage.isNotEmpty
                                  ? _errorMessage
                                  : 'Terjadi kesalahan saat mengunduh file PDF dari server.',
                              style: const TextStyle(fontSize: 14, color: AppColors.neutral500),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ElevatedButton.icon(
                                  onPressed: () {
                                    setState(() {
                                      _isLoading = true;
                                      _hasError = false;
                                      _errorMessage = '';
                                    });
                                  },
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Coba Lagi'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary700,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                OutlinedButton.icon(
                                  onPressed: () => _openInBrowser(context, pdfUrl),
                                  icon: const Icon(Icons.open_in_new),
                                  label: const Text('Buka di Browser'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.neutral700,
                                    side: const BorderSide(color: AppColors.neutral300),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ],
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
}
