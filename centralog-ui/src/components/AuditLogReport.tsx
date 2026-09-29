import { useEffect, useState } from 'react';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { assetApiEnriched, type AuditLogEntryDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Reports.css';

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
    return <div className="report-state" role="status">Loading audit history…</div>;
  }

  if (errorMessage) {
    return (
      <div className="report-state report-error" role="alert">
        <ShieldAlert size={20} aria-hidden="true" /> {errorMessage}
      </div>
    );
  }

  return (
    <section className="audit-report" aria-labelledby="audit-report-title">
      <div className="report-header audit-report-header">
        <ClipboardList size={22} className="text-bright" aria-hidden="true" />
        <div>
          <p className="report-eyebrow">ASSET HISTORY</p>
          <h2 id="audit-report-title">Audit log</h2>
          <p>Read-only history of asset changes, custodian handoffs, and room relocations.</p>
        </div>
        <span className="audit-count">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>

      <div className="report-table-frame" role="region" aria-label="Audit log table" tabIndex={0}>
        <p className="report-scroll-hint no-print">Scroll sideways to see the full audit entry.</p>
        <table className="modern-table ledger-table audit-table">
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Asset</th>
              <th scope="col">What changed</th>
              <th scope="col">Custodian handoff</th>
              <th scope="col">Room relocation</th>
              <th scope="col">Performed by</th>
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
