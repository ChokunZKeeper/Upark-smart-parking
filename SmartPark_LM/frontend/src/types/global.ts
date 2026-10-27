export type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}


// dashboard type

export type Metric = {
  value: number;
  changePct: number;
};

export type DashboardStats = {
  totalRevenue: Metric;
  currentVehicles: Metric;
  avgParkHours: Metric;
};

