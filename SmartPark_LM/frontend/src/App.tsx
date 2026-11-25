<<<<<<< HEAD
import { Routes, Route, useNavigate } from "react-router-dom";
import Signin from "@/pages/login/Sign_in";
import Home from "@/pages/home/Home";
import System from "@/pages/system/System";
import Layout from "@components/system_layout/layout/Layout";
=======
// import
import { Routes, Route } from "react-router-dom";
import Signin from "@/pages/login/Sign_in"
import Home from "@/pages/home/Home"
import System from "@/pages/system/System"
import Dashboard from "@components/system_layout/DashBoard";
import Layout from "@components/system_layout/layout/Layout";
import { useNavigate } from "react-router-dom";
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

// style
import "./Index.css";

function App() {
<<<<<<< HEAD
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
=======

  const navigate = useNavigate()
  const handleSuccess = (uuid: string) => {navigate(`/system/${uuid}`)};
  
  return (
    <>
      <Routes>
          <Route path="/signin" element={<Signin onSuccessProps={handleSuccess}/>}/>
          <Route path="/" element={<Home />}/>

          <Route element={<Layout />}>
            <Route path="/system/:url_uuid/*" element={<System />}/>
          </Route>
      </Routes>
    </>
  );
}

export default App;
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
