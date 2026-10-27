// import
import { Routes, Route } from "react-router-dom";
import Login from "@/pages/login/Login"
import Home from "@/pages/home/Home"
// style
import "./App.scss";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />}/>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
