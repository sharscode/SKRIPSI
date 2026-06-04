class NotificationModel {
  final int id;
  final String judul;
  final String pesan;
  final String tipe;
  final bool isRead;
  final int? acaraId;
  final int? latihanId;
  final String? createdAt;

  const NotificationModel({
    required this.id,
    required this.judul,
    required this.pesan,
    required this.tipe,
    required this.isRead,
    this.acaraId,
    this.latihanId,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? 0,
      judul: json['judul']?.toString() ?? '',
      pesan: json['pesan']?.toString() ?? '',
      tipe: json['tipe']?.toString() ?? 'info',
      isRead: json['is_read'] == true || json['is_read'] == 1,
      acaraId: json['acara_id'],
      latihanId: json['latihan_id'],
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'judul': judul,
      'pesan': pesan,
      'tipe': tipe,
      'is_read': isRead,
      'acara_id': acaraId,
      'latihan_id': latihanId,
      'created_at': createdAt,
    };
  }

  DateTime? get createdAtDate {
    if (createdAt == null) return null;
    try {
      return DateTime.parse(createdAt!);
    } catch (_) {
      return null;
    }
  }

  String get timeAgo {
    final dt = createdAtDate;
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    if (diff.inDays < 7) return '${diff.inDays} hari lalu';
    return '${(diff.inDays / 7).floor()} minggu lalu';
  }
}
