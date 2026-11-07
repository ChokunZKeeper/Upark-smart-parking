import allmodules from "@/module/Allmodules";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Home = () => {
  const [ userInfo, setUserInfo ] = useState<any>(null);
  const { url_uuid } = useParams()

  useEffect(() => {
    const getUser = async () => {const result = await allmodules.sendRequest("5000", "systemuuid", "post", "application/json",{user_uuid: url_uuid}); setUserInfo(result.userInfo)}
    getUser()
  },[url_uuid])
  return (
    <>
      <h1>{userInfo?.email}</h1>
    </>
  );
};

export default Home;
