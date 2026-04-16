"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CITY_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

interface ChartData {
  date: string;
  orders: number;
  revenue: number;
}

export function OrdersByDateChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-orange-500 mb-4">Orders by Date</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueByDateChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-orange-500 mb-4">Revenue by Date (KZT)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} KZT`} />
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatusData {
  status: string;
  count: number;
}

interface CityData {
  city: string;
  orders: number;
  revenue: number;
}

export function OrdersByCityPieChart({ data }: { data: CityData[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-orange-500 mb-4">Orders by City</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="orders"
            nameKey="city"
            cx="50%"
            cy="45%"
            outerRadius={120}
            label={({ percent }: { percent?: number }) =>
              `${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={true}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} orders`} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueByCityChart({ data }: { data: CityData[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-orange-500 mb-4">Revenue by City (KZT)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <YAxis dataKey="city" type="category" fontSize={12} width={100} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} KZT`} />
          <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_GROUP_COLORS: Record<string, string> = {
  new: "#6366f1",
  approval: "#f59e0b",
  assembling: "#06b6d4",
  delivery: "#8b5cf6",
  complete: "#10b981",
  cancel: "#ef4444",
};

const STATUS_GROUP_LABELS: Record<string, string> = {
  new: "",
  approval: "Согласование",
  assembling: "Комплектация",
  delivery: "Доставка",
  complete: "Выполнен",
  cancel: "Отменён",
};

const STATUS_GROUP_ORDER = ["new", "approval", "assembling", "delivery", "complete", "cancel"];

interface StatusPipelineData {
  group: string;
  count: number;
  statuses: StatusData[];
}

export function OrderStatusPipeline({ data }: { data: StatusPipelineData[] }) {
  const sorted = STATUS_GROUP_ORDER
    .map((g) => data.find((d) => d.group === g))
    .filter((d): d is StatusPipelineData => !!d);

  const maxCount = Math.max(...sorted.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-orange-500 mb-6">Order Pipeline</h2>
      <div className="flex items-end gap-3">
        {sorted.map((stage, i) => {
          const color = STATUS_GROUP_COLORS[stage.group] || "#94a3b8";
          const label = STATUS_GROUP_LABELS[stage.group] || stage.group;
          const heightPct = Math.max((stage.count / maxCount) * 100, 8);

          return (
            <div key={stage.group} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-2xl font-bold" style={{ color }}>
                {stage.count}
              </span>
              <div
                className="w-full rounded-lg transition-all"
                style={{
                  backgroundColor: color,
                  height: `${heightPct * 1.5}px`,
                  minHeight: "12px",
                  opacity: 0.85,
                }}
              />
              <span className="text-xs text-gray-600 text-center font-medium mt-1">
                {label}
              </span>
              {stage.statuses.length > 0 && (
                <div className="text-[10px] text-gray-400 text-center leading-tight">
                  {stage.statuses.map((s) => (
                    <div key={s.status}>
                      {s.status}: {s.count}
                    </div>
                  ))}
                </div>
              )}
              {i < sorted.length - 1 && (
                <span className="hidden" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
