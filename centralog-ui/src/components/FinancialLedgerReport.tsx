// File path: centralog-ui/src/components/FinancialLedgerReport.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { assetApiEnriched, type DepreciationLedgerReportDto, type LedgerAssetRowDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Printer, ShieldAlert, DollarSign, Download, Filter, RotateCcw } from 'lucide-react';
import './Reports.css';

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
        setErrorMessage(err.message || 'Unable to load the financial ledger.');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasClearance(['Accountant', 'SystemAdmin'])) {
      loadFinancialData();
    } else {
      setIsLoading(false);
      setErrorMessage('Your account does not have access to the financial ledger.');
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
      <div className="report-state" role="status">
        Loading financial ledger…
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="report-state report-error" role="alert">
        <ShieldAlert size={20} aria-hidden="true" />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMessage}</span>
      </div>
    );
  }

  if (!report) return null;

  return (
    <section className="centralog-ledger-wrapper financial-report" aria-labelledby="financial-report-title">
      
      {/* Report title prints; export and print actions do not. */}
      <div className="report-header">
        <div>
          <p className="report-eyebrow">FINANCIAL REPORT</p>
          <h2 id="financial-report-title">Asset depreciation ledger</h2>
          <p>Generated {new Date(report.generatedAt).toLocaleString()}</p>
        </div>
        <div className="report-actions no-print">
          <button 
            type="button"
            onClick={handleExportCSV} 
            disabled={filteredRows.length === 0}
            className="report-button report-button-secondary"
          >
            <Download size={16} aria-hidden="true" /> Export CSV
          </button>
          <button 
            type="button"
            onClick={handleTriggerSystemPrint} 
            disabled={filteredRows.length === 0}
            className="report-button report-button-primary"
          >
            <Printer size={16} aria-hidden="true" /> Print ledger
          </button>
        </div>
      </div>

      {/* Filter Control Toolbar - Hidden During Physical Print */}
      <div className="report-filters no-print">
        <div className="report-filter-fields">
          <p className="report-filter-title"><Filter size={16} aria-hidden="true" /> Filter ledger</p>

          {/* Status Filter */}
          <div className="report-filter-field">
            <label htmlFor="ledger-status-filter">Status</label>
            <select
              id="ledger-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="InMaintenance">In Repair Loop</option>
              <option value="Active">Active Fleet</option>
              <option value="Procured">Procured</option>
              <option value="Disposed">Disposed / Retired</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div className="report-filter-field">
            <label htmlFor="ledger-classification-filter">Classification</label>
            <select
              id="ledger-classification-filter"
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
            >
              <option value="ALL">All Classifications</option>
              {availableClassifications.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(selectedStatus !== 'ALL' || selectedClassification !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="report-button report-reset"
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset filters
            </button>
          )}
        </div>

        <div className="report-results" role="status">
          Showing <strong>{filteredRows.length}</strong> of <strong>{report.rows.length}</strong> assets
        </div>
      </div>

      {/* Dynamic Summary KPI Deck */}
      <div className="report-summary">
        <div className="report-summary-card">
          <div className="report-summary-icon">
            <DollarSign size={23} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedStatus !== 'ALL' || selectedClassification !== 'ALL' ? 'Filtered historical cost' : 'Total historical cost'}
            </div>
            <div className="report-summary-value mono">
              ₱{filteredCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="report-summary-card">
          <div className="report-summary-icon">
            <DollarSign size={23} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedStatus !== 'ALL' || selectedClassification !== 'ALL' ? 'Filtered book value' : 'Current book value'}
            </div>
            <div className="report-summary-value mono">
              ₱{filteredBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Financial Matrix Sheet */}
      <div className="report-table-frame" role="region" aria-label="Financial ledger table" tabIndex={0}>
        <p className="report-scroll-hint no-print">Scroll sideways to see all ledger columns.</p>
        <table className="financial-table">
          <thead>
            <tr>
              <th scope="col">Asset ID</th>
              <th scope="col">Asset</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Depreciation method</th>
              <th scope="col" className="report-number">Historical cost</th>
              <th scope="col" className="report-number">Accumulated depreciation</th>
              <th scope="col" className="report-number">Current book value</th>
              <th scope="col" className="report-number">Residual salvage</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="report-empty">
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
                      <span className={`report-status ${isRepairLoop ? 'is-repair' : ''}`}>
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

    </section>
  );
};
