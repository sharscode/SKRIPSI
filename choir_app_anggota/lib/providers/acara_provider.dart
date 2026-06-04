import 'package:flutter/material.dart';
import '../models/acara_model.dart';
import '../models/peserta_model.dart';
import '../services/api_service.dart';

class AcaraProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  List<AcaraModel> _acaraList = [];
  List<PesertaModel> _myRegistrations = [];
  bool _isLoading = false;
  String? _error;

  List<AcaraModel> get acaraList => _acaraList;
  List<PesertaModel> get myRegistrations => _myRegistrations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AcaraModel? getAcaraById(int id) {
    for (var a in _acaraList) {
      if (a.id == id) return a;
    }
    return null;
  }

  Future<void> fetchAll({int? userAnggotaId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _api.get('/acara');
      debugPrint('AcaraProvider.fetchAll result: $result');
      if (result['success'] == true) {
        final list = (result['data'] as List<dynamic>? ?? []);
        _acaraList = list
            .map((e) => AcaraModel.fromJson(e as Map<String, dynamic>))
            .toList();
        debugPrint('AcaraProvider.fetchAll parsed ${_acaraList.length} events');
      } else {
        _error = result['message']?.toString();
        debugPrint('AcaraProvider.fetchAll error from API: $_error');
      }

      if (userAnggotaId != null) {
        final regResult = await _api.get('/peserta-acara/anggota/$userAnggotaId');
        debugPrint('AcaraProvider.fetchMyRegistrations result: $regResult');
        if (regResult['success'] == true) {
          final list = (regResult['data'] as List<dynamic>? ?? []);
          _myRegistrations = list
              .map((e) => PesertaModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e, stack) {
      debugPrint('AcaraProvider.fetchAll exception: $e');
      debugPrint('Stacktrace: $stack');
      _error = 'Gagal memuat data acara.';
    }

    _isLoading = false;
    notifyListeners();
  }
}

