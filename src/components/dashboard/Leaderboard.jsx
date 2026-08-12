import { Medal } from 'lucide-react';

export default function Leaderboard({ rows, loading, currentEmail }) {
  return (
    <section className="db-card card leaderboard-card">
      <div className="card-header"><h3><Medal size={17} color="var(--accent)" /> Batch Leaderboard</h3></div>
      <div className="leaderboard-body">
        <table className="leaderboard-table">
          <thead><tr><th>Rank</th><th>Student</th><th>Score</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="loading-td">Loading rankings...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="loading-td">No data available.</td></tr>
            ) : rows.map((stud, idx) => {
              const rank = idx + 1;
              const isSelf = stud.email === currentEmail;
              return (
                <tr key={stud.email} className={isSelf ? 'is-highlighted' : ''}>
                  <td><div className={`rank-badge rank-${rank <= 3 ? rank : 'other'}`}>{rank}</div></td>
                  <td><span className={isSelf ? 'self-label' : ''}>{isSelf ? `You (${stud.name})` : stud.name}</span></td>
                  <td><strong>{stud.percentage || 0}%</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
