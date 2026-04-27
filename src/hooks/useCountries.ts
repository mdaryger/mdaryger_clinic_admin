import { useEffect, useState } from 'react';

import { getAllCountries, type Country } from '../services/countryService';

type UseCountriesResult = {
  countries: Country[];
  loading: boolean;
  error: string | null;
};

export function useCountries(loadOnMount = true): UseCountriesResult {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadOnMount) {
      setCountries([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllCountries();

        if (isMounted) {
          setCountries(data);
        }
      } catch (unknownError) {
        if (isMounted) {
          setCountries([]);
          setError(unknownError instanceof Error ? unknownError.message : 'Unable to load countries.');
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
  }, [loadOnMount]);

  return { countries, loading, error };
}
