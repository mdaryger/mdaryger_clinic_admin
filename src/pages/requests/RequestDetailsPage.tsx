import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { RequestDetailsSections } from '../../features/requests/RequestDetailsSections';
import {
  getRequestById,
  getRequestSourceFromPathname,
  getRequestSourceLabel,
  matchesRequestBranch,
  type RequestRecord,
} from '../../services/requestService';
import { useAuthStore } from '../../store/authStore';

export function RequestDetailsPage() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { requestId } = useParams();
  const source = getRequestSourceFromPathname(pathname, searchParams);
  const isBranchMode = pathname.startsWith('/branch-requests');
  const basePath = pathname.startsWith('/clinic-visit-requests')
    ? '/clinic-visit-requests'
    : pathname.startsWith('/home-visit-requests-plan')
      ? '/home-visit-requests-plan'
      : pathname.startsWith('/clinic-requests')
        ? '/clinic-requests'
        : '/branch-requests';
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!requestId) {
      setError('Request id is missing.');
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
        setError('This request is not available for the current clinic.');
        return;
      }

      if (isBranchMode && clinicBranchId && !matchesRequestBranch(requestData, clinicBranchId)) {
        setRequest(null);
        setError('This request is not available for the current branch.');
        return;
      }

      setRequest(requestData);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load request.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, isBranchMode, requestId, source]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  if ((isBranchMode && !isBranchAdmin) || (!isBranchMode && !isClinicAdmin)) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label="Loading request..." />;
  }

  if (error) {
    return <ErrorState title="Unable to load request" description={error} actionLabel="Retry" onAction={() => void loadRequest()} />;
  }

  if (!request) {
    return <ErrorState title="Request not found" description="The requested request does not exist." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getRequestSourceLabel(source)}
        description={`Read-only request details for ${request.id}.`}
        actions={
          <Link to={`${basePath}${isBranchMode ? `?source=${source}` : ''}`}>
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
        }
      />

      <RequestDetailsSections request={request} />
    </div>
  );
}
