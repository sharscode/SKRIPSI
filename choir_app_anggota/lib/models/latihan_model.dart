class LatihanModel {
  final int id;
  final String tanggal;
  final String jam;
  final String lokasi;
  final String? keterangan;
  final String tipeLatihan;
  final int? acaraId;
  final String? namaAcara;
  final int waktuNotifikasi;

  const LatihanModel({
    required this.id,
    required this.tanggal,
    required this.jam,
    required this.lokasi,
    this.keterangan,
    required this.tipeLatihan,
    this.acaraId,
    this.namaAcara,
    required this.waktuNotifikasi,
  });

  factory LatihanModel.fromJson(Map<String, dynamic> json) {
    return LatihanModel(
      id: json['id'] ?? 0,
      tanggal: _parseDate(json['tanggal']),
      jam: json['jam']?.toString() ?? '',
      lokasi: json['lokasi']?.toString() ?? '',
      keterangan: json['keterangan']?.toString(),
      tipeLatihan: json['tipe_latihan']?.toString() ?? 'rutin',
      acaraId: json['acara_id'] as int?,
      namaAcara: json['nama_acara']?.toString(),
      waktuNotifikasi: json['waktu_notifikasi'] as int? ?? 60,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tanggal': tanggal,
        'jam': jam,
        'lokasi': lokasi,
        'keterangan': keterangan,
        'tipe_latihan': tipeLatihan,
        'acara_id': acaraId,
        'nama_acara': namaAcara,
        'waktu_notifikasi': waktuNotifikasi,
      };

  DateTime? get tanggalAsDate {
    try {
      return DateTime.parse(tanggal);
    } catch (_) {
      return null;
    }
  }

  bool get isRutin => tipeLatihan == 'rutin';

  bool get isUpcoming {
    final dt = tanggalAsDate;
    if (dt == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return dt.isAtSameMomentAs(today) || dt.isAfter(today);
  }

  String get tipeDisplay => isRutin ? 'Latihan UKM' : 'Latihan Persiapan Acara';

  static String _parseDate(dynamic value) {
    if (value == null) return '';
    final str = value.toString();
    if (str.length >= 10) return str.substring(0, 10);
    return str;
  }
}
