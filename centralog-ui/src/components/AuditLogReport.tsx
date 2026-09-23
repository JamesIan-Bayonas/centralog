import { useEffect, useState } from 'react';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { assetApiEnriched, type AuditLogEntryDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuditLogReport = () => {
  const { hasClearance } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAuditLog = async () => {
      try {
        setEntries(await assetApiEnriched.getAuditLog());
      } catch (error: any) {
        setErrorMessage(error.message || 'Unable to load the audit log.');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasClearance(['Accountant', 'SystemAdmin'])) {
      loadAuditLog();
    } else {
      setIsLoading(false);
      setErrorMessage('Your account does not have audit-log clearance.');
    }
  }, []);

  if (isLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading auditable change history...</div>;
  }

  if (errorMessage) {
    return (
      <div style={{ padding: '30px', margin: '20px', border: '1px dashed var(--clr-danger)', borderRadius: '8px', color: 'var(--clr-danger)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <ShieldAlert size={20} /> {errorMessage}
      </div>
    );
  }

  return (
    <section className="content-deck" style={{ paddingTop: '24px' }}>
      <div className="filter-panel" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ClipboardList size={22} className="text-bright" />
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Audit Log</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Read-only history of asset changes, custodian handoffs, and room relocations.</p>
        </div>
      </div>

      <div className="table-viewport">
        <table className="modern-table ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Asset</th>
              <th>What Changed</th>
              <th>Custodian Handoff</th>
              <th>Room Relocation</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry) => {
              const custodianChanged = entry.oldCustodianId !== entry.newCustodianId;
              const roomChanged = entry.oldRoomId !== entry.newRoomId;

              return (
                <tr key={entry.logId}>
                  <td className="mono">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td><strong>#{entry.assetId}</strong> {entry.assetName}</td>
                  <td>{entry.changeSummary}</td>
                  <td>{custodianChanged ? `${entry.oldCustodianName} → ${entry.newCustodianName}` : '—'}</td>
                  <td>{roomChanged ? `${entry.oldRoomName} → ${entry.newRoomName}` : '—'}</td>
                  <td>{entry.operatorUsername}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="empty-state-cell">No audited asset changes have been recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
