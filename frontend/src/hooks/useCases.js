import { useState, useMemo } from 'react';
import { useSupport } from '../context/SupportContext';

export const useCases = () => {
  const {
    cases,
    openCases,
    casesRequiringAttention,
    getCaseById,
    isLoading,
    isLiveBackendConnected,
    refreshData,
  } = useSupport();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.itemName.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.orderNumber.toLowerCase().includes(query) ||
        (item.refundId && item.refundId.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (selectedStatus === 'ALL') return true;
      const statusUpper = (item.status || '').toUpperCase();
      if (selectedStatus === 'OPEN') return statusUpper !== 'RESOLVED' && statusUpper !== 'CLOSED';
      if (selectedStatus === 'ATTENTION') return item.priority === 'HIGH' || item.slaState === 'At risk' || item.slaState === 'Breached' || item.slaStatus === 'AT_RISK' || item.slaStatus === 'BREACHED';
      if (selectedStatus === 'ESCALATED') return item.slaEscalated || statusUpper === 'ESCALATED' || statusUpper.includes('ESCALAT');
      if (selectedStatus === 'RESOLVED') return statusUpper === 'RESOLVED' || statusUpper === 'CLOSED';

      return statusUpper === selectedStatus.toUpperCase();
    });
  }, [cases, searchQuery, selectedStatus]);

  return {
    cases,
    openCases,
    casesRequiringAttention,
    filteredCases,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    getCaseById,
    isLoading,
    isLiveBackendConnected,
    refreshData,
  };
};

export default useCases;
