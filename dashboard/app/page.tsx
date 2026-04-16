import { createClient } from "@supabase/supabase-js";
import {
  OrdersByDateChart,
  RevenueByDateChart,
  OrderStatusPipeline,
  OrdersByCityPieChart,
  RevenueByCityChart,
} from "./components/OrdersChart";

async function getOrders() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: true });
  return orders || [];
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const orders = await getOrders();

  // Aggregate by date
  const byDate = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const date = o.created_at?.slice(0, 10) || "unknown";
    const entry = byDate.get(date) || { orders: 0, revenue: 0 };
    entry.orders += 1;
    entry.revenue += Number(o.total_summ) || 0;
    byDate.set(date, entry);
  }
  const dateData = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  // Aggregate by status group
  const STATUS_TO_GROUP: Record<string, string> = {
    new: "new",
    "availability-confirmed": "approval",
    "offer-analog": "approval",
    "ready-to-wait": "approval",
    "waiting-for-arrival": "approval",
    "client-confirmed": "approval",
    prepayed: "approval",
    "send-to-assembling": "assembling",
    assembling: "assembling",
    "assembling-complete": "assembling",
    "send-to-delivery": "delivery",
    delivering: "delivery",
    redirect: "delivery",
    "ready-for-self-pickup": "delivery",
    "arrived-in-pickup-point": "delivery",
    complete: "complete",
    "partially-completed": "complete",
    "no-call": "cancel",
    "no-product": "cancel",
    "already-buyed": "cancel",
    "delyvery-did-not-suit": "cancel",
    "prices-did-not-suit": "cancel",
    "cancel-other": "cancel",
    return: "cancel",
  };

  const groupMap = new Map<
    string,
    { count: number; statuses: Map<string, number> }
  >();
  for (const o of orders) {
    const status = o.status || "unknown";
    const group = STATUS_TO_GROUP[status] || "other";
    const entry = groupMap.get(group) || {
      count: 0,
      statuses: new Map<string, number>(),
    };
    entry.count += 1;
    entry.statuses.set(status, (entry.statuses.get(status) || 0) + 1);
    groupMap.set(group, entry);
  }
  const pipelineData = Array.from(groupMap.entries()).map(([group, v]) => ({
    group,
    count: v.count,
    statuses: Array.from(v.statuses.entries()).map(([status, count]) => ({
      status,
      count,
    })),
  }));

  // Aggregate by city
  const byCity = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const city = o.delivery_city || "Unknown";
    const entry = byCity.get(city) || { orders: 0, revenue: 0 };
    entry.orders += 1;
    entry.revenue += Number(o.total_summ) || 0;
    byCity.set(city, entry);
  }
  const cityData = Array.from(byCity.entries())
    .map(([city, v]) => ({ city, ...v }))
    .sort((a, b) => b.orders - a.orders);

  // Summary stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o.total_summ) || 0),
    0
  );
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-orange-500 mb-8">Order Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm font-medium text-orange-400">Total Orders</p>
          <p className="text-3xl font-bold text-rose-400">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm font-medium text-orange-400">Total Revenue</p>
          <p className="text-3xl font-bold text-rose-400">
            {totalRevenue.toLocaleString()} KZT
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm font-medium text-orange-400">Avg Order Value</p>
          <p className="text-3xl font-bold text-rose-400">
            {Math.round(avgOrder).toLocaleString()} KZT
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <OrdersByCityPieChart data={cityData} />
        <RevenueByCityChart data={cityData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <OrdersByDateChart data={dateData} />
        <RevenueByDateChart data={dateData} />
      </div>

      <OrderStatusPipeline data={pipelineData} />
    </div>
  );
}
