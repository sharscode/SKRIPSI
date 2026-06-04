class AcaraModel {
  final int id;
  final String namaAcara;
  final String tanggal;
  final String jenisKegiatan;
  final String lokasi;
  final String penyelenggara;
  final String penanggungJawab;
  final String jenisSkkk;
  final String status;
  final int jumlahLatihan;

  const AcaraModel({
    required this.id,
    required this.namaAcara,
    required this.tanggal,
    required this.jenisKegiatan,
    required this.lokasi,
    required this.penyelenggara,
    required this.penanggungJawab,
    required this.jenisSkkk,
    required this.status,
    required this.jumlahLatihan,
  });

  factory AcaraModel.fromJson(Map<String, dynamic> json) {
    return AcaraModel(
      id: json['id'] ?? 0,
      namaAcara: json['nama_acara']?.toString() ?? '',
      tanggal: _parseDate(json['tanggal']),
      jenisKegiatan: json['jenis_kegiatan']?.toString() ?? '',
      lokasi: json['lokasi']?.toString() ?? '',
      penyelenggara: json['penyelenggara']?.toString() ?? '',
      penanggungJawab: json['penanggung_jawab']?.toString() ?? '',
      jenisSkkk: json['jenis_skkk']?.toString() ?? '',
      status: json['status']?.toString() ?? 'aktif',
      jumlahLatihan: json['jumlah_latihan'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama_acara': namaAcara,
      'tanggal': tanggal,
      'jenis_kegiatan': jenisKegiatan,
      'lokasi': lokasi,
      'penyelenggara': penyelenggara,
      'penanggung_jawab': penanggungJawab,
      'jenis_skkk': jenisSkkk,
      'status': status,
      'jumlah_latihan': jumlahLatihan,
    };
  }

  DateTime? get tanggalAsDate {
    try {
      return DateTime.parse(tanggal);
    } catch (_) {
      return null;
    }
  }

  bool get isAktif => status == 'aktif';
  bool get isSelesai => status == 'selesai';

  String get statusDisplay {
    if (status.isEmpty) return '-';
    return status[0].toUpperCase() + status.substring(1);
  }

  static String _parseDate(dynamic value) {
    if (value == null) return '';
    final str = value.toString();
    if (str.length >= 10) return str.substring(0, 10);
    return str;
  }
}
