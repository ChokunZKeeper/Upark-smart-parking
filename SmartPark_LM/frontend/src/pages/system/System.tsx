import allmodules from "@/module/Allmodules";
import { useEffect, useState } from "react";
import { useParams, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@components/system_layout/DashBoard";
import Parking from "@components/system_layout/Parking";
import HeatMap from "@components/system_layout/HeatMap";
import Reports from "@components/system_layout/Reports";
import QrcodePage from "@components/system_layout/QrcodePage";
import Permissions from "@components/system_layout/Permissions";
import VehicleSearch from "@components/system_layout/VehicleSearch";
import Settings from "@components/system_layout/Settings";
import Notifications from "@components/system_layout/Notifications";
import Taxation from "@components/system_layout/Taxation";
import Roles from "@components/system_layout/Roles";
import SystemSettings from "@components/system_layout/SettingsSystem"
import EditParkinglayout from "@components/system_layout/EditParkingLayout.tsx";
import KioskPage from "@components/system_layout/KioskPage";
import Profile from "@components/system_layout/Profile"; // เพิ่ม

export const useUserInfo = () => {
    const [ UserInfo, setUserInfo ] = useState<any>(null);
    const { url_uuid } = useParams()

    useEffect(() => {

      if(!url_uuid){
        return
      }

      const getUser = async () => {const result = await allmodules.sendRequest("5000", "systemuuid", "post", "application/json",{user_uuid: url_uuid}); 
      setUserInfo(result.user)}

      getUser()
    },[url_uuid])

    return UserInfo
}

const System = () => {
  const { url_uuid } = useParams()
  // ใช้ path เต็ม (absolute) เสมอ ห้ามใช้ "dashboard" เฉย ๆ เพราะจะต่อท้าย URL เดิมจนวนลูป
  const dashboardPath = `/system/${url_uuid}/dashboard`

  return (
        <Routes>
            <Route index element={<Navigate to={dashboardPath} replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="parking" element={<Parking />} />
            <Route path="heatmap" element={<HeatMap />} />
            <Route path="reports" element={<Reports />} />
            <Route path="qrcode" element={<QrcodePage />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="vehicle-search" element={<VehicleSearch />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="taxation" element={<Taxation />} />
            <Route path="roles" element={<Roles />} />
            <Route path="edit_parking_layout" element={<EditParkinglayout />} />
            <Route path="kiosk" element={<KioskPage />} />
            <Route path="profile" element={<Profile />} />  {/* เพิ่ม */}
            <Route path="*" element={<Navigate to={dashboardPath} replace />} />
      </Routes>
  );
};

export default System;