// File path: centralog-ui/src/components/FinancialLedgerReport.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { assetApiEnriched, type DepreciationLedgerReportDto, type LedgerAssetRowDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Printer, ShieldAlert, DollarSign, Download, Filter, RotateCcw } from 'lucide-react';

export const FinancialLedgerReport: React.FC = () => {
  const { hasClearance } = useAuth();
  const [report, setReport] = useState<DepreciationLedgerReportDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');

  useEffect(() => {
    const loadFinancialData = async () => {
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
      loadFinancialData();
    } else {
      setIsLoading(false);
      setErrorMessage('Security Breach: Your account role does not hold clearance to pull deep asset valuation ledgers.');
    }
  }, [hasClearance]);

  // Extract unique classifications from ingested report rows
  const availableClassifications = useMemo(() => {
    if (!report?.rows) return [];
    const tags = new Set(report.rows.map((r: LedgerAssetRowDto) => r.categoryTag).filter(Boolean));
    return Array.from(tags).sort();
  }, [report]);

  // Compute filtered dataset with case-insensitive status matching
  const filteredRows = useMemo(() => {
    if (!report?.rows) return [];

    return report.rows.filter((row: LedgerAssetRowDto) => {
      const rawStatus = (row.currentStatus || '').toLowerCase();
      
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'InMaintenance' && (rawStatus === 'inmaintenance' || rawStatus === '3')) ||
        (selectedStatus === 'Active' && (rawStatus === 'active' || rawStatus === '2')) ||
        (selectedStatus === 'Procured' && (rawStatus === 'procured' || rawStatus === '1')) ||
        (selectedStatus === 'Disposed' && (rawStatus === 'disposed' || rawStatus === '5'));

      const matchesClassification =
        selectedClassification === 'ALL' ||
        row.categoryTag.toLowerCase() === selectedClassification.toLowerCase();

      return matchesStatus && matchesClassification;
    });
  }, [report, selectedStatus, selectedClassification]);

  // Dynamically derive KPI values based on active filters
  const { filteredCost, filteredBookValue } = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        filteredCost: acc.filteredCost + r.historicalCost,
        filteredBookValue: acc.filteredBookValue + r.currentBookValue,
      }),
      { filteredCost: 0, filteredBookValue: 0 }
    );
  }, [filteredRows]);

  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSelectedClassification('ALL');
  };

  const handleTriggerSystemPrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!filteredRows.length) return;

    const headers = [
      'Asset ID',
      'Hardware Descriptor',
      'Classification (Category)',
      'Status',
      'Assigned Algorithm',
      'Historical Cost',
      'Accumulated Depreciation',
      'Current Book Value',
      'Residual Salvage'
    ];

    const rows = filteredRows.map((r: LedgerAssetRowDto) => [
      r.assetId,
      `"${r.assetName.replace(/"/g, '""')}"`,
      `"${r.categoryTag.replace(/"/g, '""')}"`,
      `"${r.currentStatus === 'InMaintenance' ? 'In Repair Loop' : r.currentStatus}"`,
      `"${r.depreciationMethod}"`,
      r.historicalCost.toFixed(2),
      r.accumulatedDepreciation.toFixed(2),
      r.currentBookValue.toFixed(2),
      r.salvageValue.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Asset_Ledger_Filtered_${selectedClassification}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Asset Depreciation Ledger</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time balance metrics computed on: {new Date(report.generatedAt).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportCSV} 
            disabled={filteredRows.length === 0}
            style={{ background: 'var(--clr-success)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <Download size={16} /> Export Report (CSV)
          </button>
          <button 
            onClick={handleTriggerSystemPrint} 
            disabled={filteredRows.length === 0}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <Printer size={16} /> Print Compliance Audit Sheet
          </button>
        </div>
      </div>

      {/* Filter Control Toolbar - Hidden During Physical Print */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-raised)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
            <Filter size={16} style={{ color: 'var(--accent)' }} />
            <span>Filter Report:</span>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', outline: 'none' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="InMaintenance">In Repair Loop</option>
              <option value="Active">Active Fleet</option>
              <option value="Procured">Procured</option>
              <option value="Disposed">Disposed / Retired</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Classification</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              style={{ background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', outline: 'none' }}
            >
              <option value="ALL">All Classifications</option>
              {availableClassifications.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(selectedStatus !== 'ALL' || selectedClassification !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              style={{ alignSelf: 'flex-end', background: 'none', border: '1px dashed var(--border)', color: 'var(--text-muted)', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredRows.length}</strong> of <strong>{report.rows.length}</strong> items
        </div>
      </div>

      {/* Dynamic Summary KPI Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '6px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedStatus !== 'ALL' || selectedClassification !== 'ALL' ? 'Filtered Historical Cost' : 'Total Ingested Historical Cost'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px' }}>
              ₱{filteredCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--clr-success)', borderRadius: '6px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedStatus !== 'ALL' || selectedClassification !== 'ALL' ? 'Filtered Book Valuation' : 'Current System Book Valuation'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px' }}>
              ₱{filteredBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Financial Matrix Sheet */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px' }}>Asset ID</th>
              <th style={{ padding: '14px' }}>Hardware Descriptor</th>
              <th style={{ padding: '14px' }}>Asset Category</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px' }}>Assigned Algorithm</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Historical Cost</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Accumulated Dep.</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Current Book Value</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Residual Salvage</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No assets match the selected status and classification criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row: LedgerAssetRowDto) => {
                const isRepairLoop = (row.currentStatus || '').toLowerCase() === 'inmaintenance' || row.currentStatus === '3';
                return (
                  <tr key={row.assetId} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }} className="ledger-table-row">
                    <td style={{ padding: '14px', fontFamily: 'monospace' }}>#{row.assetId}</td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{row.assetName}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 8px', background: 'var(--canvas)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {row.categoryTag}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isRepairLoop ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: isRepairLoop ? 'var(--clr-warning)' : 'var(--clr-success)',
                      }}>
                        {isRepairLoop ? 'In Repair Loop' : row.currentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px' }}>{row.depreciationMethod}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace' }}>₱{row.historicalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--clr-danger)' }}>₱{row.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--clr-success)', fontWeight: 600 }}>₱{row.currentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace' }}>₱{row.salvageValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};