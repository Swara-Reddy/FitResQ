import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  LifeBuoy,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowUpDown,
  FilterX,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import CopyButton from '../components/common/CopyButton';
import { formatCurrency } from '../utils/formatters';
import { ProductThumbnail } from '../utils/productImages';

export const MyCases = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    filteredCases,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    cases,
    isLoading,
    isLiveBackendConnected,
  } = useCases();

  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'priority' | 'amount' | 'newest'

  // Sync search param from TopNavbar if present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams, setSearchQuery]);

  const tabs = [
    { id: 'ALL', label: 'All Cases', count: cases.length },
    {
      id: 'OPEN',
      label: 'Active',
      count: cases.filter((c) => {
        const s = (c.status || '').toUpperCase();
        return s !== 'RESOLVED' && s !== 'CLOSED';
      }).length,
    },
    {
      id: 'ATTENTION',
      label: 'Requires Attention',
      count: cases.filter(
        (c) =>
          c.priority === 'HIGH' ||
          c.slaState === 'At risk' ||
          c.slaState === 'Breached' ||
          c.slaStatus === 'AT_RISK' ||
          c.slaStatus === 'BREACHED'
      ).length,
    },
    {
      id: 'ESCALATED',
      label: 'SLA Escalated',
      count: cases.filter((c) => c.slaEscalated || (c.status || '').toUpperCase().includes('ESCALAT')).length,
    },
    {
      id: 'RESOLVED',
      label: 'Resolved',
      count: cases.filter((c) => {
        const s = (c.status || '').toUpperCase();
        return s === 'RESOLVED' || s === 'CLOSED';
      }).length,
    },
  ];

  // Apply client-side sorting
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'urgency') {
      return (a.slaHoursRemaining ?? 99) - (b.slaHoursRemaining ?? 99);
    }
    if (sortBy === 'priority') {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    if (sortBy === 'amount') {
      return (b.refundAmount || 0) - (a.refundAmount || 0);
    }
    return b.id.localeCompare(a.id);
  });

  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  const getCaseStep = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'CLOSED') return 3;
    if (s === 'IN_PROGRESS' || s === 'UNDER REVIEW' || s === 'ESCALATED' || s === 'ACTION_REQUIRED') return 2;
    return 1;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <LifeBuoy className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Support Case Ledger & SLA Tracking</span>
            </div>
            {isLiveBackendConnected && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>AWS Live Gateway</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Customer Support Cases
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Manage your open order complaints, return inspections, and refund resolution workflows backed by 24h SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            icon={RotateCcw}
            onClick={() => navigate('/refund-request')}
            className="shadow-xs text-xs sm:text-sm"
          >
            Request Refund
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/ai-support')}
            className="shadow-xs bg-brand-600 hover:bg-brand-700 text-white"
          >
            Raise Support Issue
          </Button>
        </div>
      </div>

      {/* Filter, Search, and Sort Bar */}
      <Card className="p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedStatus === tab.id
                      ? 'bg-white/20 text-white dark:bg-brand-700'
                      : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, order, refund..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                aria-label="Sort cases"
              >
                <option value="urgency" className="dark:bg-slate-900">SLA Urgency</option>
                <option value="priority" className="dark:bg-slate-900">Priority (High first)</option>
                <option value="amount" className="dark:bg-slate-900">Amount (High to Low)</option>
                <option value="newest" className="dark:bg-slate-900">Case ID</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Case List */}
      <div className="space-y-4">
        {sortedCases.length === 0 ? (
          <Card className="p-12 text-center dark:bg-slate-900 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No support cases found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              No cases matched your current filter criteria. Try changing your search query or reset your filters.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                icon={FilterX}
                onClick={handleResetFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        ) : (
          sortedCases.map((item) => {
            const isHighOrEscalated =
              item.priority === 'HIGH' || item.slaEscalated || item.status === 'ESCALATED';
            const step = getCaseStep(item.status);

            return (
              <Card
                key={item.id}
                hover
                onClick={() => navigate(`/cases/${item.id}`)}
                className={`p-5 sm:p-6 transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800 ${
                  isHighOrEscalated
                    ? 'border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50/20 via-white to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900'
                    : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Product Thumbnail + Case Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 mt-1">
                      <ProductThumbnail
                        title={item.itemName}
                        category={item.category}
                        size="md"
                        className="shadow-xs"
                      />
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-lg border border-brand-100 dark:border-brand-800/60">
                            {item.id}
                          </span>
                          <CopyButton text={item.id} label="Case ID" size="xs" />
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>Order {item.orderNumber || item.orderId}</span>
                          <CopyButton text={item.orderNumber || item.orderId} label="Order ID" size="xs" />
                        </div>

                        <Badge priority={item.priority} />
                        <Badge status={item.status} />

                        {item.slaEscalated && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Escalated</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {item.itemName}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Category: <strong className="text-slate-700 dark:text-slate-300">{item.category}</strong></span>
                        <span>•</span>
                        <span>Issue: <span className="text-slate-700 dark:text-slate-300">{item.issueType}</span></span>
                        {item.refundId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              Refund: {item.refundId}
                              <CopyButton text={item.refundId} label="Refund ID" size="xs" />
                            </span>
                          </>
                        )}
                      </div>

                      {/* 3-Step Visual Journey Track */}
                      <div className="flex items-center gap-2 pt-2 text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium text-brand-700 dark:text-brand-300">
                          <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                          <span>Initiated</span>
                        </div>
                        <div className={`h-0.5 w-6 sm:w-10 rounded ${step >= 2 ? 'bg-brand-600 dark:bg-brand-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        <div className={`flex items-center gap-1.5 font-medium ${step >= 2 ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400 dark:text-slate-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-brand-600 dark:bg-brand-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span>{item.slaEscalated ? 'Escalated Review' : 'Under Review'}</span>
                        </div>
                        <div className={`h-0.5 w-6 sm:w-10 rounded ${step >= 3 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        <div className={`flex items-center gap-1.5 font-medium ${step >= 3 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span>Resolved</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Refund value, SLA, Action */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800 gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block uppercase font-medium tracking-wider">
                        Refund Amount
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(item.refundAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.slaEscalated ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Senior Agent Assigned</span>
                        </div>
                      ) : item.status === 'Resolved' || item.status === 'RESOLVED' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolution Confirmed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{item.slaHoursRemaining}h remaining in SLA</span>
                        </div>
                      )}

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyCases;
