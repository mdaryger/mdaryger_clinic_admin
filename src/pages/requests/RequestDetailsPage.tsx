import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { RequestDetailsSections } from '../../features/requests/RequestDetailsSections';
import { useI18n } from '../../i18n/useI18n';
import {
  getRequestListBasePath,
  getRequestById,
  getRequestSourceFromPathname,
  isBranchRequestPath,
  matchesRequestBranch,
  type RequestRecord,
} from '../../services/requestService';
import { useAuthStore } from '../../store/authStore';

export function RequestDetailsPage() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { requestId } = useParams();
  const source = getRequestSourceFromPathname(pathname, searchParams);
  const isBranchMode = isBranchRequestPath(pathname);
  const basePath = getRequestListBasePath(pathname);
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourceTitle =
    source === 'clinicVisit'
      ? t('requests.source.clinicVisit')
      : source === 'plannedHomeVisit'
        ? t('requests.source.plannedHomeVisit')
        : t('requests.source.homeVisit');

  const loadRequest = useCallback(async () => {
    if (!requestId) {
      setError(t('requests.missingId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData = await getRequestById(source, requestId);

      if (!requestData) {
        setRequest(null);
        return;
      }

      if (clinicId && requestData.clinicId && requestData.clinicId !== clinicId) {
        setRequest(null);
        setError(t('requests.unavailableCurrentClinic'));
        return;
      }

      if (isBranchMode && clinicBranchId && !matchesRequestBranch(requestData, clinicBranchId)) {
        setRequest(null);
        setError(t('requests.unavailableCurrentBranch'));
        return;
      }

      setRequest(requestData);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('requests.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, isBranchMode, requestId, source, t]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  if ((isBranchMode && !isBranchAdmin) || (!isBranchMode && !isClinicAdmin)) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('requests.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('requests.loadFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadRequest()} />;
  }

  if (!request) {
    return <ErrorState title={t('requests.notFoundTitle')} description={t('requests.notFoundDescription')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={sourceTitle}
        description={t('requests.detailsDescription', { id: request.id })}
        actions={
          <Link to={`${basePath}${isBranchMode && basePath === '/branch-requests' ? `?source=${source}` : ''}`}>
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('requests.back')}
            </Button>
          </Link>
        }
      />

      <RequestDetailsSections request={request} />
    </div>
  );
}
