export function getStatusLabel(status) {
  const map = {
    aktif: 'Aktif', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
    ikut: 'Ikut', batal: 'Batal', diganti: 'Diganti',
    menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak',
    hadir: 'Hadir', alpha: 'Alpha', izin: 'Izin', sakit: 'Sakit',
    sopran: 'Sopran', alto: 'Alto', tenor: 'Tenor', bass: 'Bass',
    admin: 'Admin', super_admin: 'Super Admin',
    sekali: 'Sekali', rutin: 'Rutin',
  };
  return map[status] || status;
}

export function getStatusVariant(status) {
  const map = {
    aktif: 'success', selesai: 'info', dibatalkan: 'danger',
    disetujui: 'success', ditolak: 'danger', menunggu: 'warning',
    hadir: 'success', alpha: 'danger', izin: 'warning', sakit: 'info',
    ikut: 'success', batal: 'danger', diganti: 'warning',
    sopran: 'primary', alto: 'success', tenor: 'warning', bass: 'info',
    super_admin: 'primary', admin: 'neutral',
  };
  return map[status] || 'neutral';
}
