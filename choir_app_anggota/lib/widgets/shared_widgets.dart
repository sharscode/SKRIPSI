import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'package:intl/intl.dart';

// ── Shared UI Widgets ─────────────────────────────────────

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? color;
  final double borderRadius;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.color,
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color ?? Colors.white,
      borderRadius: BorderRadius.circular(borderRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: Container(
          padding: padding ?? const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: AppColors.neutral200),
          ),
          child: child,
        ),
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color bgColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    required this.bgColor,
  });

  factory StatusBadge.fromStatus(String status) {
    return StatusBadge(
      label: _label(status),
      color: _color(status),
      bgColor: _bgColor(status),
    );
  }

  static String _label(String s) {
    switch (s.toLowerCase()) {
      case 'aktif': return 'Aktif';
      case 'selesai': return 'Selesai';
      case 'dibatalkan': return 'Dibatalkan';
      case 'hadir': return 'Hadir';
      case 'alpha': return 'Alpha';
      case 'izin': return 'Izin';
      case 'sakit': return 'Sakit';
      case 'disetujui': return 'Disetujui';
      case 'menunggu': return 'Menunggu';
      case 'ditolak': return 'Ditolak';
      case 'sopran': return 'Sopran';
      case 'alto': return 'Alto';
      case 'tenor': return 'Tenor';
      case 'bass': return 'Bass';
      case 'rutin': return 'Rutin';
      case 'sekali': return 'Persiapan';
      default: return s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '-';
    }
  }

  static Color _color(String s) {
    switch (s.toLowerCase()) {
      case 'aktif': case 'hadir': case 'disetujui': return AppColors.success;
      case 'selesai': return AppColors.info;
      case 'dibatalkan': case 'alpha': case 'ditolak': return AppColors.danger;
      case 'izin': case 'menunggu': return AppColors.warning;
      case 'sakit': return const Color(0xFFED8936);
      case 'sopran': return AppColors.sopran;
      case 'alto': return AppColors.alto;
      case 'tenor': return AppColors.tenor;
      case 'bass': return AppColors.bass;
      default: return AppColors.neutral500;
    }
  }

  static Color _bgColor(String s) {
    final c = _color(s);
    return c.withOpacity(0.12);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: AppColors.neutral800,
            ),
          ),
          if (actionLabel != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary400,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;

  const EmptyState({
    super.key,
    required this.emoji,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 56)),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.neutral700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.neutral400,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LoadingShimmer extends StatefulWidget {
  final double height;
  final double? width;
  final double borderRadius;

  const LoadingShimmer({
    super.key,
    required this.height,
    this.width,
    this.borderRadius = 12,
  });

  @override
  State<LoadingShimmer> createState() => _LoadingShimmerState();
}

class _LoadingShimmerState extends State<LoadingShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat();
    _anim = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        height: widget.height,
        width: widget.width ?? double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value + 1, 0),
            colors: [
              AppColors.neutral100,
              AppColors.neutral200,
              AppColors.neutral100,
            ],
          ),
        ),
      ),
    );
  }
}

// ── Date Formatting Helpers ────────────────────────────────

String formatDate(String? dateStr, {bool withDay = false}) {
  if (dateStr == null || dateStr.isEmpty) return '-';
  try {
    final dt = DateTime.parse(dateStr);
    if (withDay) {
      return DateFormat('EEEE, d MMMM yyyy', 'id').format(dt);
    }
    return DateFormat('d MMM yyyy', 'id').format(dt);
  } catch (_) {
    return dateStr;
  }
}

String formatDateShort(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return '-';
  try {
    final dt = DateTime.parse(dateStr);
    return DateFormat('d MMM', 'id').format(dt);
  } catch (_) {
    return dateStr;
  }
}

String formatDayMonth(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return '-';
  try {
    final dt = DateTime.parse(dateStr);
    return DateFormat('d', 'id').format(dt);
  } catch (_) {
    return '';
  }
}

String formatMonth(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return '-';
  try {
    final dt = DateTime.parse(dateStr);
    return DateFormat('MMM', 'id').format(dt);
  } catch (_) {
    return '';
  }
}
