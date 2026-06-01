import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../common/Card';

const Chart = ({ type = 'bar', data, title, height = 300 }) => {
  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' && (
          <BarChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="scans" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

export default Chart;
