import { useState } from "react"

import type { RegisterForm } from "@/types/global"


function Employee(){
    const [from, set_from] = useState<RegisterForm>({
        firstName:"",
        lastName:"",
        email: "",
        password: "",
        confirmPassword: ""
    });


    const allowedDomains = ["gmail.com","hotmail.com","outlook.com"];

    const problems = {
        hasEmptyField : (Object.keys(from) as (keyof RegisterForm)[]).some((key) => from[key] === ""),
        isAllowedDomain : !(allowedDomains.includes(from.email.slice(from.email.indexOf("@") + 1))),
        isStrongPassword : !(/[A-Z]/.test(from.password) && /[a-z]/.test(from.password) && /[0-9]/.test(from.password) && /[^a-zA-Z0-9]/.test(from.password)),
        isPasswordMatch : (from.password !== from.confirmPassword)
    }


    const summit = async () => {
        if((problems.hasEmptyField)){
            console.log("Null")
        }else if(problems.isAllowedDomain){
            console.log("Email noting")
        }else if(problems.isStrongPassword){
            console.log("Password need a-zA-Z0-9[]_./|?+-#@!$%^&")
        }else if(problems.isPasswordMatch){
            console.log("Password not Confirm password")
        }else{
            try{
                const res = await fetch("http://localhost:5000/register",{
                    method: "POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body: JSON.stringify(from)
                });

                const data = await res.json();
                console.log(res)
                if(!res.ok){
                    console.log("Error:", data.message);
                    return;
                }
                console.log("Done", data);
            }catch (err){
                console.log("cannot connet Server: ", err);
            }
        }
    }

    return <>
        <div>
            <h1>Register</h1>
            <input type="text" name="First name" placeholder="Fist name" onChange={(text) => set_from({...from, firstName : text.target.value.trim()})}/>
            <input type="text" name="Last name" placeholder="Last name" onChange={(text) => set_from({...from, lastName : text.target.value.trim()})}/>
            <input type="text" name="Email" placeholder="Email" onChange={(text) => set_from({...from, email : text.target.value.trim().toLowerCase()})}/>
            <input type="password" name="Password" placeholder="Password" onChange={(text) => set_from({...from, password : text.target.value.trim()})}/>
            <input type="password" name="Confirm password" placeholder="Confirm password" onChange={(text) => set_from({...from, confirmPassword : text.target.value.trim()})}/>
            <button onClick={summit}>Register</button>
        </div>
    </>
}

export default Employee