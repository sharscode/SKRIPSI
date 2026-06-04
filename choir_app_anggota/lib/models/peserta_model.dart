class PesertaModel {
  final int id;
  final int anggotaId;
  final int acaraId;
  final String statusPeserta;
  final String approvalStatus;
  final String? namaAcara;
  final String? tanggal;
  final String? lokasi;
  final String statusAcara;

  const PesertaModel({
    required this.id,
    required this.anggotaId,
    required this.acaraId,
    required this.statusPeserta,
    required this.approvalStatus,
    this.namaAcara,
    this.tanggal,
    this.lokasi,
    required this.statusAcara,
  });

  factory PesertaModel.fromJson(Map<String, dynamic> json) {
    return PesertaModel(
      id: json['id'] ?? 0,
      anggotaId: json['anggota_id'] ?? 0,
      acaraId: json['acara_id'] ?? 0,
      statusPeserta: json['status_peserta']?.toString() ?? 'ikut',
      approvalStatus: json['approval_status']?.toString() ?? 'menunggu',
      namaAcara: json['nama_acara']?.toString(),
      tanggal: _parseDate(json['tanggal']),
      lokasi: json['lokasi']?.toString(),
      statusAcara: json['status_acara']?.toString() ?? 'aktif',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'anggota_id': anggotaId,
      'acara_id': acaraId,
      'status_peserta': statusPeserta,
      'approval_status': approvalStatus,
      'nama_acara': namaAcara,
      'tanggal': tanggal,
      'lokasi': lokasi,
      'status_acara': statusAcara,
    };
  }

  DateTime? get tanggalAsDate {
    if (tanggal == null) return null;
    try {
      return DateTime.parse(tanggal!);
    } catch (_) {
      return null;
    }
  }

  bool get isApproved =>
      approvalStatus == 'disetujui' || approvalStatus == 'approved';

  bool get isPending =>
      approvalStatus == 'menunggu' || approvalStatus == 'pending';

  bool get isRejected =>
      approvalStatus == 'ditolak' || approvalStatus == 'rejected';

  bool get isAcaraSelesai => statusAcara == 'selesai';

  String get approvalStatusDisplay {
    switch (approvalStatus.toLowerCase()) {
      case 'disetujui':
      case 'approved':
        return 'Disetujui';
      case 'menunggu':
      case 'pending':
        return 'Menunggu';
      case 'ditolak':
      case 'rejected':
        return 'Ditolak';
      default:
        return approvalStatus;
    }
  }

  static String? _parseDate(dynamic value) {
    if (value == null) return null;
    final str = value.toString();
    if (str.length >= 10) return str.substring(0, 10);
    return str;
  }
}

/// Lightweight model for a member as participant (in peserta lists).
class AnggotaPesertaModel {
  final int id;
  final String namaLengkap;
  final String bagianSuara;
  final String nrp;

  const AnggotaPesertaModel({
    required this.id,
    required this.namaLengkap,
    required this.bagianSuara,
    required this.nrp,
  });

  factory AnggotaPesertaModel.fromJson(Map<String, dynamic> json) {
    return AnggotaPesertaModel(
      id: json['id'] ?? json['anggota_id'] ?? 0,
      namaLengkap: json['nama_lengkap']?.toString() ?? '',
      bagianSuara: json['bagian_suara']?.toString() ?? '',
      nrp: json['nrp']?.toString() ?? '',
    );
  }
}
