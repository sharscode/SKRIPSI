import './StatCard.css';
export default function StatCard({ icon, label, value, trend, color = 'primary', loading = false }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        {loading ? <div className="stat-skeleton" /> : <p className="stat-value">{value}</p>}
        {trend !== undefined && (
          <p className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}
