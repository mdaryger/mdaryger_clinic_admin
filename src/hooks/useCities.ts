import { useEffect, useState } from 'react';

import { getCitiesByCountry, type City } from '../services/cityService';

type UseCitiesResult = {
  cities: City[];
  loading: boolean;
  error: string | null;
};

export function useCities(countryId?: string | null): UseCitiesResult {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(Boolean(countryId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCitiesByCountry(countryId);

        if (isMounted) {
          setCities(data);
        }
      } catch (unknownError) {
        if (isMounted) {
          setCities([]);
          setError(unknownError instanceof Error ? unknownError.message : 'Unable to load cities.');
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
  }, [countryId]);

  return { cities, loading, error };
}
