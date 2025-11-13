import React from 'react';
import type { MedicalRecord, BloodTest } from '../types';
import { RecordType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BloodTestChartProps {
  data: MedicalRecord[];
  metricName: string;
  timePeriod: string;
}

const formatDate = (dateString: string, period: string) => {
    const date = new Date(dateString);
    if (period === 'day') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const CustomTooltip = ({ active, payload, label, metricName, unit }: any) => {
    if (active && payload && payload.length) {
        const bgColor = 'white';
        const textColor = 'rgb(30 41 59)';
        return (
            <div className="p-2 border border-slate-300 rounded-lg shadow-lg" style={{ backgroundColor: bgColor, color: textColor }}>
                <p className="font-bold mb-1">{label}</p>
                <p style={{ color: '#38bdf8' }}>{`${metricName}: ${payload[0].value} ${unit}`}</p>
            </div>
        );
    }
    return null;
};

export const BloodTestChart: React.FC<BloodTestChartProps> = ({ data, metricName, timePeriod }) => {
  const chartData = data
    .filter((r): r is BloodTest => r.type === RecordType.BloodTest)
    .map(test => {
      const value = test.values.find(v => v.name === metricName);
      return value ? { date: test.date, value: value.value, unit: value.unit } : null;
    })
    .filter((item): item is { date: string; value: number; unit: string } => item !== null)
    .map(item => ({...item, name: formatDate(item.date, timePeriod)}))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (chartData.length < 2) {
    return <p className="text-slate-500 text-center py-4">Нужно как минимум две записи для построения графика для "{metricName}" за выбранный период.</p>;
  }
  
  const unit = chartData[0]?.unit || '';
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
                <YAxis tick={{ fill: tickColor }} />
                <Tooltip content={<CustomTooltip metricName={metricName} unit={unit} />} />
                <Legend wrapperStyle={{ color: tickColor }} />
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#38bdf8" 
                    name={metricName} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};