import './Badge.css';
import { getStatusLabel, getStatusVariant } from '../../utils/formatStatus';

export default function Badge({ status, label, variant, size = 'md' }) {
  const v = variant || getStatusVariant(status);
  const l = label || getStatusLabel(status) || status;
  return <span className={`badge badge-${v} badge-${size}`}>{l}</span>;
}
