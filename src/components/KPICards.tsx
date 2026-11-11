import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../api/config';
import { today } from '../api/hooks';

export default function KPICards() {
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadKpiData = async () => {
      try {
        setLoading(true);
        setError(null);

        const date = today();

        // ✅ correct: call the function and use the returned full URL
        const unknownUrl = ENDPOINTS.DETECTION.UNKNOWN({ date });
        const knownUrl = ENDPOINTS.DETECTION.KNOWN({ date });

        console.log('unknownUrl:', unknownUrl);
        console.log('knownUrl:', knownUrl);

        const [unknownRes, knownRes] = await Promise.all([
          fetch(unknownUrl),
          fetch(knownUrl),
        ]);

        if (!unknownRes.ok || !knownRes.ok) {
          throw new Error(`HTTP ${unknownRes.status} / ${knownRes.status}`);
        }

        const [unknownData, knownData] = await Promise.all([
          unknownRes.json(),
          knownRes.json(),
        ]);

        const total = (unknownData?.length ?? 0) + (knownData?.length ?? 0);
        const unknownCount = unknownData?.length ?? 0;
        const knownCount = knownData?.length ?? 0;

        setKpiData([
          { title: 'Total Meals', value: total, icon: '🍽️', color: 'blue', trend: '+8.2%' },
          { title: 'Unknown Users', value: unknownCount, icon: '⚠️', color: 'amber', trend: '+3.1%' },
          { title: 'Registered Users', value: knownCount, icon: '✅', color: 'green', trend: '+5.4%' },
        ]);
      } catch (err) {
        console.error('Failed to load KPI data using attendance/detection APIs', err);
        setError("Unable to fetch today's meal summary");
      } finally {
        setLoading(false);
      }
    };

    loadKpiData();
  }, []);

  return (
    <div>
      <h2>KPI Cards</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div>
          {kpiData.map((item, index) => (
            <div key={index}>
              <h3>{item.title}</h3>
              <p>{item.value}</p>
              <p>{item.trend}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}