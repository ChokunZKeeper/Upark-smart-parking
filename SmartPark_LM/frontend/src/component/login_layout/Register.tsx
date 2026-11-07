import { useState, useRef } from "react";

import type { RegisterForm } from "@/types/global";
import allmodules from "@/module/Allmodules";
import mail from "@/constants/mail.json" with {type: "json"}
import Signin from "@/pages/login/Sign_in";


function Register(){
    const [currentPage,setCurrentPage] = useState<"register" | "otp">("register")
    const [isVerifyDisabled, setIsVerifyDisabled] = useState<boolean>(true);
    const [isResendDisabled, setResendDisabled] = useState<boolean>();
    const [isInput, setInput] = useState<boolean>(true);
    const [isSignin, setSignin] = useState<boolean>(false);
    const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null) // เดียวพรุ่งนี้ศึกษา
    
    const [from, set_from] = useState<RegisterForm>({
        firstName:"",
        lastName:"",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [read_otp, set_otp] = useState<{myotp : string}>({
        myotp : ""
    })

    if(isSignin){
        return <Signin onSuccessProps={()=>{}}/>
    }

    const summit = async () => {
        const allowedDomains = mail.allowedEmailDomains

        const problems = {
            hasEmptyField : (Object.keys(from) as (keyof RegisterForm)[]).some((key) => from[key] === ""),
            isAllowedDomain : !(allowedDomains.includes(from.email.slice(from.email.indexOf("@") + 1))),
            isStrongPassword : !(/[A-Z]/.test(from.password) && /[a-z]/.test(from.password) && /[0-9]/.test(from.password) && /[^a-zA-Z0-9]/.test(from.password)),
            isPasswordMatch : (from.password !== from.confirmPassword),
        }

        if((problems.hasEmptyField)){console.log("Null"); return}
        if (problems.isAllowedDomain) {console.log("Email domain not allowed"); return }
        if (problems.isStrongPassword) {console.log("Password need a-zA-Z0-9 and a symbol"); return }
        if (problems.isPasswordMatch) {console.log("Password not Confirm password"); return }

        const checkemail = await allmodules.sendRequest("5000","checkemail","post","application/json",from)
        if (checkemail.exists){console.log("This email address already exists"); return}

        return setCurrentPage("otp")
    }   



    
    const resendEmail = async () => {
        setResendDisabled(true);
        setInput(true);
        setIsVerifyDisabled(true);

        const result = await allmodules.sendRequest("5000", "otp", "post", "application/json", { email: from.email });
        if(!result){
            setResendDisabled(false); return
        };

        set_otp({myotp : ""});
        setIsVerifyDisabled(true);
        setInput(false);
        resendTimer.current = setTimeout(() => {setResendDisabled(false);}, 30000);
    }

    const verify_email = async () => {
        if(isVerifyDisabled) return   
        const checkOTP = await allmodules.sendRequest("5000","verifyotp","post","application/json",{email: from.email, myotp: read_otp.myotp});

        if(checkOTP?.check === "otp completed"){
            if(resendTimer.current){
                clearTimeout(resendTimer.current);
            }
            setIsVerifyDisabled(true); 
            setInput(true); 
            setResendDisabled(true);

            allmodules.sendRequest("5000","register","post","application/json",from) // ส่งข้อมูลที่เรา กรอกไป
            location.reload()
        }
            
        if(checkOTP?.check === "max attempts reached" || checkOTP?.check === "otp expired"){
            set_otp({myotp : ""}); 
            setIsVerifyDisabled(true); 
            setInput(true)
        }
    }

    return <>
            {allmodules.formInput(currentPage,"register",
            <div>
                <h1>Register</h1>
                <input type="text" name="First name" placeholder="Fist name" onChange={(text) => set_from({...from, firstName : text.target.value.trim()})}/>
                <input type="text" name="Last name" placeholder="Last name" onChange={(text) => set_from({...from, lastName : text.target.value.trim()})}/>
                <input type="text" name="Email" placeholder="Email" onChange={(text) => set_from({...from, email : text.target.value.trim().toLowerCase()})}/>
                <input type="password" name="Password" placeholder="Password" onChange={(text) => set_from({...from, password : text.target.value.trim()})}/>
                <input type="password" name="Confirm password" placeholder="Confirm password" onChange={(text) => set_from({...from, confirmPassword : text.target.value.trim()})}/>
                <button onClick={summit}>Register</button>
                <br />
                <span onClick={() => {setSignin(true)}}>back</span>
            </div>
            )}

            {allmodules.formInput(currentPage,"otp",
                <div>
                    <h1>OTP</h1>
                    <input disabled={isInput} type="text" inputMode="numeric" maxLength={6} pattern="[0-9]" value={read_otp.myotp} onChange={(text) => {const otp = text.target.value.replace(/[^0-9]/g,"").slice(0,6); set_otp({myotp: otp }); 
                                                                                                                                                        if(otp.length === 6){setIsVerifyDisabled(false)} else{setIsVerifyDisabled(true)}}}/>
                    <button disabled={isResendDisabled} onClick={resendEmail}>resendEmail</button>
                    <button disabled={isVerifyDisabled} onClick={verify_email}>Continue</button>
                </div>
            )}

    </>
}

export default Register