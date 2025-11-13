import React from 'react';
import type { Vitals } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataChartProps {
  data: Vitals[];
  timePeriod: string;
}

const formatDate = (dateString: string, period: string) => {
    const date = new Date(dateString);
    if (period === 'day') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

// Custom Tooltip Component for better display
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const bgColor = 'white';
    const textColor = 'rgb(30 41 59)';
    return (
      <div className="p-2 border border-slate-300 rounded-lg shadow-lg" style={{ backgroundColor: bgColor, color: textColor }}>
        <p className="font-bold mb-1">{label}</p>
        <ul className="text-sm">
            {payload.map((p: any) => {
                const unit = p.name === 'Пульс' ? ' уд/мин' : p.name === 'Вес' ? ' кг' : p.name === 'Температура' ? ' °C' : '';
                return <li key={p.dataKey} style={{ color: p.color }}>{`${p.name}: ${p.value}${unit}`}</li>
            })}
        </ul>
      </div>
    );
  }
  return null;
};


export const DataChart: React.FC<DataChartProps> = ({ data, timePeriod }) => {
  const chartData = [...data].reverse().map(d => ({
    name: formatDate(d.date, timePeriod),
    'Пульс': d.pulse,
    'Вес': d.weight,
    'Температура': d.temperature
  }));
  
  const tickColor = '#64748b';

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <LineChart
                data={chartData}
                margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={'#e2e8f0'} />
                <XAxis dataKey="name" tick={{ fill: tickColor }} />
                <YAxis yAxisId="left" tick={{ fill: tickColor }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: tickColor }} />
                <Line yAxisId="left" type="monotone" dataKey="Пульс" stroke="#8884d8" name="Пульс"/>
                <Line yAxisId="right" type="monotone" dataKey="Вес" stroke="#82ca9d" name="Вес" />
                 <Line yAxisId="left" type="monotone" dataKey="Температура" stroke="#f59e0b" name="Температура" domain={[35, 42]}/>
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};