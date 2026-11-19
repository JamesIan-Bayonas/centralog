import { useEffect, useRef, useState } from 'react';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { assetApiEnriched, type AuditLogEntryDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Reports.css';

export const AuditLogReport = () => {
  const { hasClearance } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState('');
  const assetSearchRef = useRef<HTMLInputElement>(null);

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

  const query = assetSearch.trim().toLowerCase();
  const idQuery = query.replace(/^#/, '');
  const searchById = /^\d+$/.test(idQuery);
  const matchingEntries = query ? entries.filter(entry => searchById
    ? String(entry.assetId) === idQuery
    : entry.assetName.toLowerCase().includes(query)
  ) : entries;

  return (
    <section className="audit-report" aria-labelledby="audit-report-title">
      <div className="report-header audit-report-header">
        <ClipboardList size={22} className="text-bright" aria-hidden="true" />
        <div>
          <p className="report-eyebrow">ASSET HISTORY</p>
          <h2 id="audit-report-title">Audit log</h2>
          <p>Read-only history of asset changes, custodian handoffs, and room relocations.</p>
        </div>
        <span className="audit-count" role="status">
          {query ? `${matchingEntries.length} of ` : ''}{entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {entries.length > 0 && (
        <div className="report-filters audit-search no-print" role="search" aria-label="Audit log">
          <div className="report-filter-field">
            <label htmlFor="audit-asset-search">Search by asset name or ID</label>
            <input
              id="audit-asset-search"
              ref={assetSearchRef}
              type="search"
              placeholder="e.g. Printer or #30"
              aria-controls="audit-log-results"
              value={assetSearch}
              onChange={event => setAssetSearch(event.target.value)}
            />
          </div>
          <button type="button" className="report-button" disabled={!assetSearch} onClick={() => {
            setAssetSearch('');
            assetSearchRef.current?.focus();
          }}>Clear search</button>
        </div>
      )}

      <div id="audit-log-results" className="report-table-frame" role="region" aria-label="Audit log table" tabIndex={0}>
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
            {matchingEntries.length > 0 ? matchingEntries.map((entry) => {
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
              <tr><td colSpan={6} className="empty-state-cell">
                {query ? 'No audit entries match this asset search.' : 'No audited asset changes have been recorded yet.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
