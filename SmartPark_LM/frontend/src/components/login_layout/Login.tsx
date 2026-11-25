import { useState, type FormEvent } from "react"
import allmodules from "@/module/Allmodules"
import mail from "@/constants/mail.json" with { type: "json" }
import { useT } from "@/i18n"

interface LoginProps {
    onSuccess: (uuid: string) => void
    onForgot?: () => void
}

// Tailwind อ่านได้เฉพาะข้อความที่เขียนตรง ๆ ห้ามประกอบ class ด้วย ${ตัวแปร} ในส่วนของ utility
const inputCls =
    "block w-full h-[clamp(38px,2.6vw,46px)] px-[14px] bg-white font-sans font-light " +
    "text-[length:clamp(16px,1.05vw,18px)] text-[#0F172A] border border-solid border-[#dedee3] " +
    "rounded-lg outline-none placeholder:text-[#88888b] placeholder:opacity-100 focus:border-[#8db7ef]"

const buttonCls =
    "w-full h-[clamp(40px,2.7vw,48px)] mt-2 rounded-[9px] border-0 bg-[#2874df] text-white " +
    "font-sans font-light text-[length:clamp(15px,1vw,18px)] cursor-pointer " +
    "hover:bg-[#1d65c8] disabled:opacity-60 disabled:cursor-not-allowed"

const errorCls = "font-sans font-light text-[14px] text-[#C0392B]"

function Login({ onSuccess, onForgot }: LoginProps) {
    const t = useT()

    const [ismail, setmail] = useState<string>("")
    const [ispassword, setpassword] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    // ถ้า key ยังไม่มีใน locales (t คืน key กลับมา) จะใช้ข้อความ fallback
    const L = (key: string, fallback: string) => {
        const v = t(key)
        return !v || v === key ? fallback : v
    }

    const focusField = (id: string) => document.getElementById(id)?.focus()

    const continue_mail = async () => {
        if (loading) return
        setError("")

        const allowedDomains: string[] = mail.allowedEmailDomains
        const problems = {
            hasEmptyField: ismail === "" || ispassword === "",
            isNotAllowedDomain: !allowedDomains.includes(ismail.slice(ismail.indexOf("@") + 1)),
        }

        if (problems.hasEmptyField) {
            setError(L("signin.login.error.empty", "Please enter your email and password."))
            focusField(ismail === "" ? "input_mail" : "input_password")
            return
        }
        if (problems.isNotAllowedDomain) {
            setError(L("signin.login.error.domain", "This email domain is not allowed."))
            focusField("input_mail")
            return
        }

        setLoading(true)
        try {
            // sendRequest คืน json หรือ null (server ไม่ตอบ / error) ต้องเช็ก null ทุกครั้ง
            const checkemail = await allmodules.sendRequest("5000", "checkemail", "post", "application/json", { email: ismail })
            if (!checkemail) {
                setError(L("signin.login.error.server", "Cannot reach the server. Please try again."))
                return
            }
            if (!checkemail.exists) {
                setError(L("signin.login.error.noEmail", "This email does not exist in the system."))
                focusField("input_mail")
                return
            }

            const checkpass = await allmodules.sendRequest("5000", "checkpassword", "post", "application/json", { password: ispassword, email: ismail })
            if (!checkpass) {
                setError(L("signin.login.error.server", "Cannot reach the server. Please try again."))
                return
            }
            if (!checkpass.isMatch) {
                setError(L("signin.login.error.password", "Incorrect password."))
                focusField("input_password")
                return
            }

            const result = await allmodules.sendRequest("5000", "getuuid", "post", "application/json", { email: ismail })
            if (!result?.systemid) {
                setError(L("signin.login.error.server", "Cannot reach the server. Please try again."))
                return
            }

            localStorage.setItem("token", result.systemid)
            onSuccess(result.systemid)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        continue_mail()
    }

    return (
        <form className="grid gap-[14px]" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="input_mail">{t("signin.login.email")}</label>
            <input
                id="input_mail"
                className={inputCls}
                type="text"
                placeholder={t("signin.login.email")}
                autoComplete="email"
                onChange={(text) => { setmail(text.target.value.trim().toLowerCase()) }}
            />

            <label className="sr-only" htmlFor="input_password">{t("signin.login.password")}</label>
            <input
                id="input_password"
                className={inputCls}
                type="password"
                placeholder={t("signin.login.password")}
                autoComplete="current-password"
                onChange={(text) => { setpassword(text.target.value) }}
            />

            {error && <p role="alert" className={errorCls}>{error}</p>}

            <button type="submit" className={buttonCls} disabled={loading}>{t("signin.login.continue")}</button>

            {/* .forgot ของต้นแบบ: กึ่งกลาง, margin-top 13.5px, ฟอนต์ SF Compact light */}
            <div className="mt-[13.5px] text-center font-sans font-light text-[8px] min-[861px]:text-[clamp(10px,0.9vw,14.5px)] max-[860px]:text-[12px]">
                <a href="#" className="text-[#1487F0] underline cursor-pointer" onClick={(e) => { e.preventDefault(); onForgot?.() }}>
                    {t("signin.login.forgot")}
                </a>
            </div>
        </form>
    )
}

export default Login