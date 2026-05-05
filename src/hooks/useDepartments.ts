import { useEffect, useState } from 'react';

import { getDepartmentsByDoctorType, type Department } from '../services/departmentService';
import type { DoctorType } from '../services/doctorService';

type UseDepartmentsResult = {
  departments: Department[];
  loading: boolean;
  error: string | null;
};

export function useDepartments(doctorType?: DoctorType | null): UseDepartmentsResult {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(Boolean(doctorType));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorType) {
      setDepartments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getDepartmentsByDoctorType(doctorType);

        if (isMounted) {
          setDepartments(data);
        }
      } catch (unknownError) {
        if (isMounted) {
          setDepartments([]);
          setError(unknownError instanceof Error ? unknownError.message : 'Unable to load departments.');
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
  }, [doctorType]);

  return { departments, loading, error };
}
