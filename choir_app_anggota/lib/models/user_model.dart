import 'dart:convert';

class UserModel {
  final int id;
  final String nrp;
  final String namaLengkap;
  final String bagianSuara;
  final String? alamat;
  final String? kontak;
  final String email;
  final String? fotoPath;
  final String? tanggalLahir;
  final String? jurusan;

  const UserModel({
    required this.id,
    required this.nrp,
    required this.namaLengkap,
    required this.bagianSuara,
    this.alamat,
    this.kontak,
    required this.email,
    this.fotoPath,
    this.tanggalLahir,
    this.jurusan,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      nrp: json['nrp']?.toString() ?? '',
      namaLengkap: json['nama_lengkap']?.toString() ?? '',
      bagianSuara: json['bagian_suara']?.toString() ?? '',
      alamat: json['alamat']?.toString(),
      kontak: json['kontak']?.toString(),
      email: json['email']?.toString() ?? '',
      fotoPath: json['foto_path']?.toString(),
      tanggalLahir: json['tanggal_lahir']?.toString(),
      jurusan: json['jurusan']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nrp': nrp,
      'nama_lengkap': namaLengkap,
      'bagian_suara': bagianSuara,
      'alamat': alamat,
      'kontak': kontak,
      'email': email,
      'foto_path': fotoPath,
      'tanggal_lahir': tanggalLahir,
      'jurusan': jurusan,
    };
  }

  String toJsonString() => jsonEncode(toJson());

  factory UserModel.fromJsonString(String jsonString) {
    return UserModel.fromJson(jsonDecode(jsonString));
  }

  String get firstName => namaLengkap.split(' ').first;

  String get initials {
    final parts = namaLengkap.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return namaLengkap.isNotEmpty ? namaLengkap[0].toUpperCase() : '?';
  }

  String get bagianSuaraDisplay {
    if (bagianSuara.isEmpty) return '-';
    return bagianSuara[0].toUpperCase() + bagianSuara.substring(1);
  }

  UserModel copyWith({
    int? id,
    String? nrp,
    String? namaLengkap,
    String? bagianSuara,
    String? alamat,
    String? kontak,
    String? email,
    String? fotoPath,
    String? tanggalLahir,
    String? jurusan,
  }) {
    return UserModel(
      id: id ?? this.id,
      nrp: nrp ?? this.nrp,
      namaLengkap: namaLengkap ?? this.namaLengkap,
      bagianSuara: bagianSuara ?? this.bagianSuara,
      alamat: alamat ?? this.alamat,
      kontak: kontak ?? this.kontak,
      email: email ?? this.email,
      fotoPath: fotoPath ?? this.fotoPath,
      tanggalLahir: tanggalLahir ?? this.tanggalLahir,
      jurusan: jurusan ?? this.jurusan,
    );
  }
}
