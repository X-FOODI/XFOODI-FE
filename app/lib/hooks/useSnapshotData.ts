'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AllTenantsSnapshot,
  TenantDetailSnapshot,
  SnapshotState,
  PeriodType,
  CustomDateRange,
} from '@/app/lib/types/snapshot.types';
import adminAxiosInstance from '@/lib/services/adminAxiosInstance';

export const useSnapshotData = () => {
  const { t } = useTranslation();

  const [state, setState] = useState<SnapshotState>({
    periodType: 'monthly',
    customRange: null,
    selectedTenantId: null,
    allTenantsData: null,
    tenantDetailData: null,
    loading: false,
    error: null,
  });

  /**
   * Fetch all tenants summary data
   */
  const fetchAllTenants = useCallback(
    async (periodType: PeriodType, customRange?: CustomDateRange) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let url = `/snapshots?periodType=${periodType}`;

        if (periodType === 'custom' && customRange) {
          url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
        }

        console.log(`[Snapshot Hook] Fetching all tenants: ${url}`);
        const response = await adminAxiosInstance.get<AllTenantsSnapshot>(url);

        console.log(`[Snapshot Hook] All tenants response:`, {
          url,
          periodType,
          tenantsCount: response.data.tenants?.length ?? 0,
          totalRevenue: response.data.totalRevenue,
        });

        setState((prev) => ({
          ...prev,
          allTenantsData: response.data,
          periodType,
          customRange: periodType === 'custom' ? customRange ?? null : null,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.errors.load_failed');
        console.error(`[Snapshot Hook] Error fetching all tenants:`, { periodType, error: errorMessage });
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    },
    [t]
  );

  /**
   * Fetch detail snapshot for a specific tenant
   */
  const fetchTenantDetail = useCallback(
    async (tenantId: string, periodType: PeriodType, customRange?: CustomDateRange) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let url = `/snapshots?tenantId=${tenantId}&periodType=${periodType}`;

        if (periodType === 'custom' && customRange) {
          url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
        }

        const response = await adminAxiosInstance.get<TenantDetailSnapshot>(url);
        
        console.log(`[Snapshot Hook] Detail response received:`, {
          url,
          tenantId,
          periodType,
          hasBreakdown: !!response.data.breakdown,
          breakdownLength: response.data.breakdown?.length ?? 0,
          revenue: response.data.revenue,
          totalOrders: response.data.totalOrders,
          fullResponse: response.data,
        });

        setState((prev) => ({
          ...prev,
          tenantDetailData: response.data,
          selectedTenantId: tenantId,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.errors.load_failed');
        console.error(`[Snapshot Hook] Error fetching detail:`, { tenantId, periodType, error: errorMessage });
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    },
    [t]
  );

  /**
   * Reset to all-tenants view
   */
  const resetToAllTenants = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTenantId: null,
      tenantDetailData: null,
    }));
  }, []);

  /**
   * Change period and refetch data
   */
  const changePeriod = useCallback(
    async (newPeriodType: PeriodType, customRange?: CustomDateRange) => {
      console.log(`[Snapshot Hook] Changing period to: ${newPeriodType}`, { customRange, currentTenantId: state.selectedTenantId });
      setState((prev) => ({
        ...prev,
        periodType: newPeriodType,
        customRange: newPeriodType === 'custom' ? customRange ?? null : null,
      }));

      // If viewing a tenant detail, refetch with new period
      if (state.selectedTenantId) {
        console.log(`[Snapshot Hook] Refetching detail for tenant ${state.selectedTenantId} with period ${newPeriodType}`);
        await fetchTenantDetail(state.selectedTenantId, newPeriodType, customRange);
      } else {
        // Otherwise refetch all tenants
        console.log(`[Snapshot Hook] Refetching all tenants with period ${newPeriodType}`);
        await fetchAllTenants(newPeriodType, customRange);
      }
    },
    [state.selectedTenantId, fetchTenantDetail, fetchAllTenants]
  );

  return {
    state,
    fetchAllTenants,
    fetchTenantDetail,
    resetToAllTenants,
    changePeriod,
  };
};
