import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Konfirmasi', message, loading = false, variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>Ya, Lanjutkan</Button>
      </>}
    >
      <p style={{ color: 'var(--c-neutral-600)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
