import Allmodules from "@/module/Allmodules";

const getToken = () => {return typeof localStorage !== "undefined" ? localStorage.getItem("token") : null}

export async function getInfomation(){
    const token  = getToken()
    const result = await Allmodules.sendRequest("5000", "parking/overview", "post", "application/json",{user_uuid: token})

    return result
}



type Period = "today" | "week" | "month" | "year";

interface SummaryItem {
  label: string;
  value: string;
  left?: string;
  trend?: { text: string; up: boolean };
}

const dashboard_info = (p: Period) => {
  return [
    "Total  Revenue",
    "Current  Vehicles",
    `This ${p === "today" ? "Today Revenue" : `This ${p.charAt(0).toUpperCase + p.slice(1).toLowerCase()} Revenue`}`,
    "Avg.  Park time"
  ];
};

const PREV: Record<Period, string> = {
  today: "Previous Day",
  week: "Previous Week",
  month: "Previous Month",
  year: "Previous Year",
};

const Dashboard_summaryItem = (p: Period): SummaryItem => {
  return {
    label: ``,
    value: ``,
    left: `${PREV[p]}`,
    trend: { text: ``, up: true },
  };
};
