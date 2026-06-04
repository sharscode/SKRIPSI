class AbsensiModel {
  final int id;
  final String status;
  final String? waktuCheckin;
  final int latihanId;
  final int anggotaId;
  final String? tanggalLatihan;
  final String? jamLatihan;
  final String? lokasiLatihan;
  final String? tipeLatihan;
  final String? namaAcara;
  final int? acaraId;

  const AbsensiModel({
    required this.id,
    required this.status,
    this.waktuCheckin,
    required this.latihanId,
    required this.anggotaId,
    this.tanggalLatihan,
    this.jamLatihan,
    this.lokasiLatihan,
    this.tipeLatihan,
    this.namaAcara,
    this.acaraId,
  });

  factory AbsensiModel.fromJson(Map<String, dynamic> json) {
    return AbsensiModel(
      id: json['id'] ?? 0,
      status: json['status']?.toString() ?? 'alpha',
      waktuCheckin: json['waktu_checkin']?.toString(),
      latihanId: json['latihan_id'] ?? 0,
      anggotaId: json['anggota_id'] ?? 0,
      tanggalLatihan: _parseDate(json['tanggal']),
      jamLatihan: json['jam']?.toString(),
      lokasiLatihan: json['lokasi']?.toString(),
      tipeLatihan: json['tipe_latihan']?.toString(),
      namaAcara: json['nama_acara']?.toString(),
      acaraId: json['acara_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'waktu_checkin': waktuCheckin,
      'latihan_id': latihanId,
      'anggota_id': anggotaId,
      'tanggal': tanggalLatihan,
      'jam': jamLatihan,
      'lokasi': lokasiLatihan,
      'tipe_latihan': tipeLatihan,
      'nama_acara': namaAcara,
      'acara_id': acaraId,
    };
  }

  bool get isHadir => status == 'hadir';
  bool get isRutin => tipeLatihan == 'rutin';

  String get statusDisplay {
    if (status.isEmpty) return '-';
    return status[0].toUpperCase() + status.substring(1);
  }

  String get checkinDisplay {
    if (waktuCheckin == null) return '-';
    return waktuCheckin!.substring(0, 16).replaceAll('T', ' ');
  }

  static String? _parseDate(dynamic value) {
    if (value == null) return null;
    final str = value.toString();
    if (str.contains('T')) return str.split('T')[0];
    if (str.length >= 10) return str.substring(0, 10);
    return str;
  }
}
