// import
import { Routes, Route } from "react-router-dom";
import Signin from "@/pages/login/Sign_in"
import Home from "@/pages/home/Home"
import System from "@/pages/system/System"
import { useNavigate } from "react-router-dom";

// style
import "./App.scss";

function App() {
  const navigate = useNavigate()
  const handleSuccess = (uuid: string) => {navigate(`/system/${uuid}`)};
  
  return (
    <>
      <Routes>
        <Route path="/system/:url_uuid" element={<System />}/>
        <Route path="/signin" element={<Signin onSuccessProps={handleSuccess}/>}/>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
