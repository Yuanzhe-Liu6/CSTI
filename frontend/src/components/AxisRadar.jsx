import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * Radar over the 8 dimensions (P, R, M, I, E, U, C, H).
 * Values are normalized [0,1] axis dominances.
 */
export default function AxisRadar({ normalized }) {
  const data = ['P', 'R', 'M', 'I', 'E', 'U', 'C', 'H'].map((dim) => ({
    dim,
    value: Math.round((normalized[dim] ?? 0.5) * 100),
  }));

  return (
    <div className="radar-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#333" />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: '#f5a623', fontSize: 13, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 10 }}
            stroke="#333"
          />
          <Radar
            dataKey="value"
            stroke="#f5a623"
            fill="#f5a623"
            fillOpacity={0.35}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
