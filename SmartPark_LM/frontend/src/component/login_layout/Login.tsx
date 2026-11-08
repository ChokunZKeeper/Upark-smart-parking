import { useState } from "react"
import allmodules from "@/module/Allmodules"
import mail from "@/constants/mail.json" with {type: "json"}

interface LoginProps{
    onSuccess : (uuid:string) => void;
}

function Login({ onSuccess } : LoginProps){

    const [ismail,setmail] = useState<string>("")
    const [ispassword,setpassword] = useState<string>("")

    const continue_mail = async () => {
        const allowedDomains = mail.allowedEmailDomains
        const problems = {
                hasEmptyField : (ismail === ""),
                isAllowedDomain : !(allowedDomains.includes(ismail.slice(ismail.indexOf("@") + 1))),
            }

        if(problems.hasEmptyField){console.log("Null"); return }
        if(problems.isAllowedDomain){ document.getElementById("input_mail")?.focus(); console.log("Email domain not allowed"); return }

        const checkemail = await allmodules.sendRequest("5000", "checkemail", "post", "application/json",{email: ismail})
        if(!checkemail.exists){ document.getElementById("input_mail")?.focus(); console.log("This email does not exist in the system"); return }
        
        const checkpass = await allmodules.sendRequest("5000", "checkpassword", "post", "application/json",{password: ispassword, email: ismail})
        if(!checkpass.isMatch){document.getElementById("input_password")?.focus(); console.log("This password does not exist in the system"); return}

        const result = await allmodules.sendRequest("5000","getuuid","post","application/json",{ email: ismail });
        onSuccess(result.systemid)
    }
    return(
        <div>
            <input className="" id="input_mail" type="text" placeholder="Email address" onChange={(text) => {setmail(text.target.value.trim().toLocaleLowerCase())}}/>
            <input id="input_password" type="password" placeholder="Password" onChange={(text) => {setpassword(text.target.value.trim())}}/>
            
            <button className="primary-btn" onClick={continue_mail}>Continue</button>
        </div>
    )
}

export default Login