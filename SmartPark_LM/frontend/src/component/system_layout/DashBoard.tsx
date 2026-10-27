import type { DashboardStats } from "@/types/global";
import { useEffect, useState } from "react";

const DashBoard = () => {
  const [stats, setstats] = useState<DashboardStats | null>(null); // คล้ายหลัการ def(test:str | int = None)
  const check = (stats === null) ? "Loading" :  useEffect(() => {},[stats]); // เช็ดว่า โหลด data ได้ยัง


  return <>{check}</>;
};

export default DashBoard;
