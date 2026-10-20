export type Metric = {
  value: number;
  changePct: number;
};

export type DashboardStats = {
  totalRevenue: Metric;
  currentVehicles: Metric;
  avgParkHours: Metric;
};
