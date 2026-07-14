// File path: centralog-ui/src/components/FinancialLedgerReport.tsx

import React, { useEffect, useState } from 'react';
import { assetApiEnriched, type DepreciationLedgerReportDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Printer, ShieldAlert, DollarSign } from 'lucide-react';

export const FinancialLedgerReport: React.FC = () => {
  const { hasClearance } = useAuth();
  const [report, setReport] = useState<DepreciationLedgerReportDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadFinancialDataData = async () => {
      try {
        setIsLoading(true);
        const data = await assetApiEnriched.getDepreciationLedgerReport();
        setReport(data);
      } catch (err: any) {
        console.error('Ledger report lookup failed:', err);
        setErrorMessage(err.message || 'Access denied or database loop timeout.');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasClearance(['Accountant', 'SystemAdmin'])) {
      loadFinancialDataData();
    } else {
      setIsLoading(false);
      setErrorMessage('Security Breach: Your account role does not hold clearance to pull deep asset valuation ledgers.');
    }
  }, [hasClearance]);

  const handleTriggerSystemPrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Recalculating real-time asset degradation matrix arrays...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ padding: '30px', margin: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--clr-danger)', borderRadius: '8px', color: 'var(--clr-danger)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <ShieldAlert size={20} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMessage}</span>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="centralog-ledger-wrapper" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Control Actions Header - Hidden During Physical Print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Asset Depreciation Ledger</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time balance metrics computed on: {new Date(report.generatedAt).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleTriggerSystemPrint} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={16} /> Print Compliance Audit Sheet
          </button>
        </div>
      </div>

      {/* Corporate Summary KPI Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '6px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Ingested Historical Cost</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px' }}>₱{report.totalHistoricalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--clr-success)', borderRadius: '6px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current System Book Valuation</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px' }}>₱{report.totalCurrentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Main High Density Financial Matrix Sheet */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px' }}>Asset ID</th>
              <th style={{ padding: '14px' }}>Hardware Descriptor</th>
              <th style={{ padding: '14px' }}>Asset Category</th>
              <th style={{ padding: '14px' }}>Assigned Algorithm</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Historical Cost</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Accumulated Dep.</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Current Book Value</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Residual Salvage</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.assetId} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }} className="ledger-table-row">
                <td style={{ padding: '14px', fontFamily: 'monospace' }}>#{row.assetId}</td>
                <td style={{ padding: '14px', fontWeight: 600 }}>{row.assetName}</td>
                <td style={{ padding: '14px' }}><span style={{ padding: '3px 8px', background: 'var(--canvas)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>{row.categoryTag}</span></td>
                <td style={{ padding: '14px', fontSize: '12px' }}>{row.depreciationMethod}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace' }}>₱{row.historicalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--clr-danger)' }}>₱{row.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--clr-success)', fontWeight: 600 }}>₱{row.currentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace' }}>₱{row.salvageValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};