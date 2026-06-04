class PartiturModel {
  final int id;
  final String judul;
  final String komposer;
  final int jumlahSuara;
  final String jenisLagu;
  final String filePdf;

  const PartiturModel({
    required this.id,
    required this.judul,
    required this.komposer,
    required this.jumlahSuara,
    required this.jenisLagu,
    required this.filePdf,
  });

  factory PartiturModel.fromJson(Map<String, dynamic> json) {
    return PartiturModel(
      id: json['id'] ?? 0,
      judul: json['judul']?.toString() ?? '',
      komposer: json['komposer']?.toString() ?? '',
      jumlahSuara: json['jumlah_suara'] ?? 0,
      jenisLagu: json['jenis_lagu']?.toString() ?? '',
      filePdf: json['file_pdf']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'judul': judul,
      'komposer': komposer,
      'jumlah_suara': jumlahSuara,
      'jenis_lagu': jenisLagu,
      'file_pdf': filePdf,
    };
  }

  String get subtitle => '$jenisLagu • $jumlahSuara Suara';
}
