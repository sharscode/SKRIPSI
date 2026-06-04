import './DataTable.css';
export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = 'Tidak ada data.' }) {
  if (loading) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>{columns.map((c) => (
                <td key={c.key}><div className="table-skeleton shimmer" /></td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (!data.length) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody><tr><td colSpan={columns.length} className="table-empty">{emptyMessage}</td></tr></tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{columns.map((c) => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
