import { useEffect, useState } from 'react';

import { getBranchesByClinicId, type ClinicBranch } from '../services/branchService';

type UseBranchesResult = {
  branches: ClinicBranch[];
  loading: boolean;
  error: string | null;
};

export function useBranches(clinicId?: string | null): UseBranchesResult {
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [loading, setLoading] = useState(Boolean(clinicId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setBranches([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getBranchesByClinicId(clinicId);

        if (isMounted) {
          setBranches(data);
        }
      } catch (unknownError) {
        if (isMounted) {
          setBranches([]);
          setError(unknownError instanceof Error ? unknownError.message : 'Unable to load branches.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clinicId]);

  return { branches, loading, error };
}
