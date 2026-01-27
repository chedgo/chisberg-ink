import { Coordinates } from '@/types/Coordinates';
import { destinationSchema, partialDestination } from '@/types/Destination';
import { useCallback, useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';

export function useFetchDestinations() {
  const { submit, isLoading, object } = useObject({
    api: '/api/locations',
    schema: destinationSchema,
  });
  const [isDoneLoading, setIsDoneLoading] = useState(false);

  const fetchDestinations = useCallback(
    (coords: Coordinates, activities: string[], maxDistance: number) => {
      if (!coords || activities.length === 0 || maxDistance === 0) {
        return;
      }
      setIsDoneLoading(false);

      submit({
        latitude: coords.lat,
        longitude: coords.lon,
        activities: activities.join(','),
        maxDistance,
      });
      setIsDoneLoading(true);
    },
    [submit]
  );

  return {
    fetchDestinations,
    isLoading,
    destinations: object?.destinations || [],
    isDoneLoading,
  };
}
