import type { DashboardStats } from "@/types/dashboard";
import { useState } from "react";

const DashBoard = () => {
  const [stats, setstats] = useState<DashboardStats | null>(null); // คล้ายหลัการ def(test:str | int = None)
  const check = (stats === null) ? "Loading" : "Done";
  
  return <>{check}</>;
};

export default DashBoard;
