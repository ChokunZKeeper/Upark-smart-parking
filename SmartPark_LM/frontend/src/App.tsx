import { Routes, Route, useNavigate } from "react-router-dom";
import Signin from "@/pages/login/Sign_in";
import Home from "@/pages/home/Home";
import System from "@/pages/system/System";
import Layout from "@components/system_layout/layout/Layout";

// style
import "./Index.css";

function App() {
  const navigate = useNavigate();
  const handleSuccess = (uuid: string) => {
    navigate(`/system/${uuid}`);
  };

  return (
    <Routes>
      <Route path="/signin" element={<Signin onSuccessProps={handleSuccess} />} />
      <Route path="/" element={<Home onSuccessProps={handleSuccess} />} />

      <Route element={<Layout />}>
        <Route path="/system/:url_uuid/*" element={<System />} />
      </Route>
    </Routes>
  );
}

export default App;