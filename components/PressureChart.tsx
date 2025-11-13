import React from 'react';
import type { Vitals } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PressureChartProps {
  data: Vitals[];
  timePeriod: string;
}

const formatDate = (dateString: string, period: string) => {
    const date = new Date(dateString);
    if (period === 'day') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        const bgColor = 'white';
        const textColor = 'rgb(30 41 59)';
        return (
        <div className="p-2 border border-slate-300 rounded-lg shadow-lg" style={{ backgroundColor: bgColor, color: textColor }}>
            <p className="font-bold mb-1">{label}</p>
            <p className="text-sm" style={{ color: '#ef4444' }}>{`Систолическое: ${dataPoint.systolic} мм рт. ст.`}</p>
            <p className="text-sm" style={{ color: '#3b82f6' }}>{`Диастолическое: ${dataPoint.diastolic} мм рт. ст.`}</p>
        </div>
        );
    }
    return null;
};

export const PressureChart: React.FC<PressureChartProps> = ({ data, timePeriod }) => {
  const chartData = [...data].reverse().map(d => ({
    name: formatDate(d.date, timePeriod),
    systolic: d.systolic,
    diastolic: d.diastolic,
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
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: tickColor }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: tickColor }} />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Систолическое" />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Диастолическое" />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};