import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { RequestFilters } from '../../features/requests/RequestFilters';
import { RequestTable } from '../../features/requests/RequestTable';
import { useI18n } from '../../i18n/useI18n';
import {
  getRequestSourceFromPathname,
  getRequestsByBranchId,
  getRequestsByClinicId,
  type RequestRecord,
} from '../../services/requestService';
import { useAuthStore } from '../../store/authStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

const PRIORITY_STATUSES = ['inProgress', 'doctorOnWay', 'accepted'] as const;
const PAGE_SIZE = 10;
import { toMillis } from '../../utils/date';

function getPriorityRank(status?: string): number {
  const index = PRIORITY_STATUSES.indexOf(status as (typeof PRIORITY_STATUSES)[number]);
  return index === -1 ? PRIORITY_STATUSES.length : index;
}

export function RequestsListPage() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const source = getRequestSourceFromPathname(pathname, searchParams);
  const isBranchMode = pathname.startsWith('/branch-requests');
  const detailsBasePath = pathname.startsWith('/clinic-visit-requests')
    ? '/clinic-visit-requests'
    : pathname.startsWith('/home-visit-requests-plan')
      ? '/home-visit-requests-plan'
      : pathname.startsWith('/clinic-requests')
        ? '/clinic-requests'
        : '/branch-requests';
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sourceTitle =
    source === 'clinicVisit'
      ? t('requests.source.clinicVisit')
      : source === 'plannedHomeVisit'
        ? t('requests.source.plannedHomeVisit')
        : t('requests.source.homeVisit');

  const loadRequests = useCallback(async () => {
    if (!clinicId) {
      setRequests([]);
      setError(t('requests.clinicUnavailable'));
      setIsLoading(false);
      return;
    }

    if (isBranchMode && !clinicBranchId) {
      setRequests([]);
      setError(t('requests.branchUnavailable'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setRequests(
        isBranchMode && clinicBranchId
          ? await getRequestsByBranchId(source, clinicId, clinicBranchId)
          : await getRequestsByClinicId(source, clinicId),
      );
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('requests.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, isBranchMode, source, t]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setPage(1);
  }, [search, status, urgency, source]);

  const filteredRequests = useMemo(() => {
    return [...requests]
      .filter((request) => {
        const matchesSearch = matchesSearchQuery(
          [request.patientName, request.patientPhone, request.doctorName],
          search,
        );
        const matchesStatus = status === 'all' || request.status === status;
        const matchesUrgency = urgency === 'all' || request.urgency === urgency;

        return matchesSearch && matchesStatus && matchesUrgency;
      })
      .sort((left, right) => {
        const rankDiff = getPriorityRank(left.status) - getPriorityRank(right.status);

        if (rankDiff !== 0) {
          return rankDiff;
        }

        return toMillis(right.createdAt) - toMillis(left.createdAt);
      });
  }, [requests, search, status, urgency]);

  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(
    () => filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRequests, page],
  );

  if ((isBranchMode && !isBranchAdmin) || (!isBranchMode && !isClinicAdmin)) {
    return <Navigate to="/home" replace />;
  }

  function handleExportCsv() {
    exportToCsv(
      `${source}-requests.csv`,
      filteredRequests.map((request) => ({
        'Patient Name': request.patientName ?? '',
        'Patient Phone': request.patientPhone ?? '',
        Status: request.status ?? '',
        Urgency: request.urgency ?? '',
        'Doctor Name': request.doctorName ?? '',
        Cost: String(request.cost ?? request.finalPrice ?? request.estimatedPrice ?? ''),
        'Created At': formatDate(request.createdAt),
        'Updated At': formatDate(request.updatedAt),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isBranchMode ? t('requests.branchRequests') : sourceTitle}
        description={t('requests.pageDescription')}
        actions={
          <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={filteredRequests.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('requests.export')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <RequestFilters
            search={search}
            status={status}
            urgency={urgency}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onUrgencyChange={setUrgency}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <LoadingState label={t('requests.loadingMany')} /> : null}
          {error ? <ErrorState title={t('requests.loadFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadRequests()} /> : null}
          {!isLoading && !error ? (
            <>
              <RequestTable
                requests={paginatedRequests}
                detailsBasePath={detailsBasePath}
                sourceQuery={isBranchMode ? source : undefined}
              />
              {filteredRequests.length > PAGE_SIZE ? (
                <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
