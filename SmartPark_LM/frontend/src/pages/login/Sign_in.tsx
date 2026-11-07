import Register from "@components/login_layout/Register";
import Login  from "@components/login_layout/Login";
import { useState } from "react";

interface Props {
    onSuccessProps: (uuid: string) => void;
}

function Signin({ onSuccessProps } : Props){

  const [showRegister, setShowRegister] = useState(false);

  if(showRegister){
    return <Register/>
  }
  return (
    <div>
      <div>
        <p>New here?</p>
        <span onClick={() => setShowRegister(true)} style={{cursor: "pointer"}}>
          Create an account
        </span>
      </div>

      <Login onSuccess={onSuccessProps}/>
    </div>
  );
};


export default Signin;
