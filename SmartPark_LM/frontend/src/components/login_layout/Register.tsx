<<<<<<< HEAD
import { useState, useRef, useEffect } from "react";

import allmodules from "@/module/Allmodules";
import mail from "@/constants/mail.json" with {type: "json"}
import Signin from "@/pages/login/Sign_in";
import {type RegisterForm } from "@/services/data/mockData"
import { getRandomColor } from "@/services/data/mockData"
import { useT } from "@/i18n"

type RegisterProps = {
    onBack?: () => void;
    onPageChange?: (page: "register" | "otp") => void;
};

// Tailwind อ่านได้เฉพาะข้อความที่เขียนตรง ๆ ห้ามประกอบ class ด้วย ${ตัวแปร} ในส่วนของ utility
const labelCls =
    "font-sans font-light text-[length:clamp(13px,0.95vw,15px)] text-[#333]"

const inputCls =
    "block w-full h-[clamp(38px,2.6vw,46px)] px-[14px] bg-white font-sans font-light " +
    "text-[length:clamp(16px,1.05vw,18px)] text-[#0F172A] border border-solid border-[#dcdce1] " +
    "rounded-lg outline-none placeholder:text-[#88888b] placeholder:opacity-100 focus:border-[#8db7ef]"

const buttonCls =
    "w-full h-[clamp(40px,2.7vw,48px)] mt-[22px] rounded-[9px] border-0 bg-[#2874df] text-white " +
    "font-sans font-light text-[length:clamp(15px,1vw,18px)] cursor-pointer " +
    "hover:bg-[#1d65c8] disabled:opacity-60"

function Register({ onBack, onPageChange }: RegisterProps) {
    const t = useT()
    const [currentPage, setCurrentPage] = useState<"register" | "otp">("register")
    const [isVerifyDisabled, setIsVerifyDisabled] = useState<boolean>(true);
    const [isResendDisabled, setResendDisabled] = useState<boolean>(false);
    const [isInput, setInput] = useState<boolean>(true);
    const [isSignin, _] = useState<boolean>(false);
    const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ช่อง OTP 6 ช่อง + เวลานับถอยหลัง 5 นาที
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])
    const [secondsLeft, setSecondsLeft] = useState<number>(300)
=======
import { useState, useRef } from "react";

import type { RegisterForm } from "@/types/global";
import allmodules from "@/module/Allmodules";
import mail from "@/constants/mail.json" with {type: "json"}
import Signin from "@/pages/login/Sign_in";

type RegisterProps = {
    onBack?: () => void;
    onOTP?: () => void;
};

function Register({ onBack, onOTP }: RegisterProps) {
    const [currentPage, setCurrentPage] = useState<"register" | "otp">("register")
    const [isVerifyDisabled, setIsVerifyDisabled] = useState<boolean>(true);
    const [isResendDisabled, setResendDisabled] = useState<boolean>();
    const [isInput, setInput] = useState<boolean>(true);
    const [isSignin, setSignin] = useState<boolean>(false);
    const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null) // เดียวพรุ่งนี้ศึกษา
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

    const [from, set_from] = useState<RegisterForm>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
<<<<<<< HEAD
        confirmPassword: "",
        gradientProfile: "color"
=======
        confirmPassword: ""
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    });
    const [read_otp, set_otp] = useState<{ myotp: string }>({
        myotp: ""
    })

<<<<<<< HEAD
    // hook ต้องอยู่ก่อน early return ด้านล่าง
    useEffect(() => {
        if (currentPage !== "otp") return
        setSecondsLeft(300)
        const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
        return () => clearInterval(id)
    }, [currentPage])

    // แจ้งหน้าแม่ว่าตอนนี้อยู่หน้า register หรือ otp
    useEffect(() => {
        onPageChange?.(currentPage)
    }, [currentPage])

    // ล้าง timer ตอน component ถูกถอดออก
    useEffect(() => {
        return () => {
            if (resendTimer.current) clearTimeout(resendTimer.current)
        }
    }, [])

=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    if (isSignin) {
        return <Signin onSuccessProps={() => { }} />
    }

    const summit = async () => {
        const allowedDomains = mail.allowedEmailDomains

        const problems = {
            hasEmptyField: (Object.keys(from) as (keyof RegisterForm)[]).some((key) => from[key] === ""),
            isAllowedDomain: !(allowedDomains.includes(from.email.slice(from.email.indexOf("@") + 1))),
            isStrongPassword: !(/[A-Z]/.test(from.password) && /[a-z]/.test(from.password) && /[0-9]/.test(from.password) && /[^a-zA-Z0-9]/.test(from.password)),
            isPasswordMatch: (from.password !== from.confirmPassword),
        }

        if ((problems.hasEmptyField)) { console.log("Null"); return }
        if (problems.isAllowedDomain) { console.log("Email domain not allowed"); return }
        if (problems.isStrongPassword) { console.log("Password need a-zA-Z0-9 and a symbol"); return }
        if (problems.isPasswordMatch) { console.log("Password not Confirm password"); return }
<<<<<<< HEAD
        const checkemail = await allmodules.sendRequest("5000", "checkemail", "post", "application/json", from)
        if (checkemail.exists) { console.log("This email address already exists"); return }

        // ไปหน้า OTP ของ Register เอง แล้วส่ง OTP + เปิดช่องกรอก
        setCurrentPage("otp")
        await resendEmail()
=======

        const checkemail = await allmodules.sendRequest("5000", "checkemail", "post", "application/json", from)
        if (checkemail.exists) { console.log("This email address already exists"); return }

        return onOTP?.() //setCurrentPage("otp")
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    }

    const resendEmail = async () => {
        setResendDisabled(true);
        setInput(true);
        setIsVerifyDisabled(true);

        const result = await allmodules.sendRequest("5000", "otp", "post", "application/json", { email: from.email });
        if (!result) {
            setResendDisabled(false); return
        };

        set_otp({ myotp: "" });
<<<<<<< HEAD
        setSecondsLeft(300);
        setIsVerifyDisabled(true);
        setInput(false);
        otpRefs.current[0]?.focus();
=======
        setIsVerifyDisabled(true);
        setInput(false);
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        resendTimer.current = setTimeout(() => { setResendDisabled(false); }, 30000);
    }

    const verify_email = async () => {
        if (isVerifyDisabled) return
        const checkOTP = await allmodules.sendRequest("5000", "verifyotp", "post", "application/json", { email: from.email, myotp: read_otp.myotp });

        if (checkOTP?.check === "otp completed") {
            if (resendTimer.current) {
                clearTimeout(resendTimer.current);
            }
            setIsVerifyDisabled(true);
            setInput(true);
            setResendDisabled(true);

<<<<<<< HEAD
            const payload = { ...from, gradientProfile: getRandomColor() ?? "dark" }
            await allmodules.sendRequest("5000", "register", "post", "application/json", payload)
=======
            allmodules.sendRequest("5000", "register", "post", "application/json", from) // ส่งข้อมูลที่เรา กรอกไป
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            location.reload()
        }

        if (checkOTP?.check === "max attempts reached" || checkOTP?.check === "otp expired") {
            set_otp({ myotp: "" });
            setIsVerifyDisabled(true);
            setInput(true)
        }
    }

<<<<<<< HEAD
    const updateOtp = (otp: string) => {
        set_otp({ myotp: otp });
        setIsVerifyDisabled(otp.length !== 6);
    }

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/[^0-9]/g, "").slice(-1)
        if (!digit) return
        const otp = (read_otp.myotp.slice(0, index) + digit + read_otp.myotp.slice(index + 1)).slice(0, 6)
        updateOtp(otp)
        otpRefs.current[Math.min(index + 1, 5)]?.focus()
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Backspace") return
        e.preventDefault()
        const target = read_otp.myotp[index] ? index : index - 1
        if (target < 0) return
        updateOtp(read_otp.myotp.slice(0, target) + read_otp.myotp.slice(target + 1))
        otpRefs.current[target]?.focus()
    }

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const otp = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)
        updateOtp(otp)
        otpRefs.current[Math.min(otp.length, 5)]?.focus()
    }

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    return <>
        {allmodules.formInput(currentPage, "register",
            <div>
                {/* !gap-[6px] ทับ gap 14px ของ formScope ให้ label ชิดช่องกรอกเหมือนภาพ */}
<<<<<<< HEAD
                <form id="register-form" className="grid gap-[6px]" onSubmit={(e) => { e.preventDefault(); summit(); }}>
                    <label htmlFor="reg-first" className={labelCls}>{t("signin.register.firstName")}</label>
                    <input
                        id="reg-first"
                        className={inputCls}
=======
                <form id="register-form" className="!gap-[6px]" onSubmit={(e) => { e.preventDefault(); summit(); }}>
                    <label htmlFor="reg-first">First name</label>
                    <input
                        id="reg-first"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                        required
                        type="text"
                        onChange={(text) => set_from({ ...from, firstName: text.target.value.trim() })}
                    />
<<<<<<< HEAD
                    <label htmlFor="reg-last" className={`${labelCls} mt-[18px]`}>{t("signin.register.lastName")}</label>
                    <input
                        id="reg-last"
                        className={inputCls}
=======
                    <label htmlFor="reg-last" className="mt-[18px]">Last name</label>
                    <input
                        id="reg-last"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                        required
                        type="text"
                        onChange={(text) => set_from({ ...from, lastName: text.target.value.trim() })}
                    />
<<<<<<< HEAD
                    <label htmlFor="reg-email" className={`${labelCls} mt-[18px]`}>{t("signin.register.email")}</label>
                    <input
                        id="reg-email"
                        className={inputCls}
=======
                    <label htmlFor="reg-email" className="mt-[18px]">Email *</label>
                    <input
                        id="reg-email"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                        required
                        type="email"
                        onChange={(text) => set_from({ ...from, email: text.target.value.trim().toLowerCase() })}
                    />
<<<<<<< HEAD
                    <label htmlFor="reg-password" className={`${labelCls} mt-[18px]`}>{t("signin.register.password")}</label>
                    <input
                        id="reg-password"
                        className={inputCls}
=======
                    <label htmlFor="reg-password" className="mt-[18px]">Password *</label>
                    <input
                        id="reg-password"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                        required
                        type="password"
                        onChange={(text) => set_from({ ...from, password: text.target.value.trim() })}
                    />
<<<<<<< HEAD
                    <label htmlFor="confirm-password" className={`${labelCls} mt-[18px]`}>{t("signin.register.confirmPassword")}</label>
                    <input
                        id="confirm-password"
                        className={inputCls}
=======
                    <label htmlFor="confirm-password" className="mt-[18px]">Confirm password *</label>
                    <input
                        id="confirm-password"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                        required
                        type="password"
                        onChange={(text) => set_from({ ...from, confirmPassword: text.target.value.trim() })}
                    />
<<<<<<< HEAD
                    <button type="submit" className={buttonCls}>{t("signin.register.submit")}</button>
=======
                    <button type="submit" className="!mt-[22px]">Register</button>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                </form>

                <div className="mt-[22px] text-center text-[clamp(14px,0.95vw,16px)]">
                    <a
                        href="#"
                        className="font-sans font-light !text-[#333] !no-underline"
                        onClick={(e) => {
                            e.preventDefault();
                            onBack?.();
                        }}
                    >
<<<<<<< HEAD
                        {t("signin.register.back")}
=======
                        Back
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                    </a>
                </div>
            </div>
        )}

        {allmodules.formInput(currentPage, "otp",
<<<<<<< HEAD
<div>
    <h2 className="!m-0 !mb-[10px] !text-[24px] !font-medium !leading-[1.25] !text-[#0F172A] min-[861px]:!mb-[17.5px] min-[861px]:!text-[32px]">
        {t("signin.register.otpTitle")}
    </h2>

    <p className="!mt-0 !mb-[24px] !leading-[1.6] !text-[#888] min-[861px]:!mb-[32px] min-[861px]:!text-[16px]">
        {t("signin.register.otpDesc")}
    </p>

    <div className="grid grid-cols-6 gap-2 min-[861px]:gap-[18px]">
        {Array.from({ length: 6 }).map((_, i) => (
            <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                className="!w-full !min-w-0 !mt-0 !h-[48px] !p-0 !text-center !text-[20px] !bg-white !border !border-solid !border-[#dedee3] !rounded-lg !outline-none focus:!border-[#8db7ef] min-[861px]:!h-[64px] min-[861px]:!text-[26px] !font-medium"
                disabled={isInput}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={read_otp.myotp[i] ?? ""}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
            />
        ))}
    </div>

    <div className="!flex !flex-wrap !justify-between !gap-2 !mt-[32px] !mb-[16px] !text-[#888] min-[861px]:!mt-[53px] min-[861px]:!mb-[24px] min-[861px]:!text-[16px]">
        <span>
            {t("signin.register.remaining")}{" "}
            <b className="!font-normal !text-[#2874df]">{formatTime(secondsLeft)}s</b>
        </span>
        <span>
            {t("signin.register.noOtp")}{" "}
            <a
                href="#"
                className="!text-[#2681e8] !underline"
                style={{
                    pointerEvents: isResendDisabled ? "none" : "auto",
                    opacity: isResendDisabled ? 0.5 : 1
                }}
                onClick={(e) => { e.preventDefault(); if (!isResendDisabled) resendEmail(); }}
            >
                {t("signin.register.resend")}
            </a>
        </span>
    </div>

    <button
        type="button"
        className="!block !w-full !mt-0 !h-[44px] !rounded-[9px] !border-0 !bg-[#2874df] !text-white !text-[16px] !cursor-pointer hover:!bg-[#1d65c8] disabled:!opacity-50 disabled:!cursor-not-allowed min-[861px]:!h-[54px]"
        disabled={isVerifyDisabled}
        onClick={verify_email}
    >
        {t("signin.register.verify")}
    </button>

    <button
        className="!block !mx-auto !mt-[14px] !border-0 !bg-transparent !text-[#999] !text-[14px] !cursor-pointer min-[861px]:!text-[16px]"
        type="button"
        onClick={() => setCurrentPage("register")}
    >
        {t("signin.register.cancel")}
    </button>
</div>
=======
            <div>
                <h1>OTP</h1>
                <input disabled={isInput} type="text" inputMode="numeric" maxLength={6} pattern="[0-9]" value={read_otp.myotp} onChange={(text) => {
                    const otp = text.target.value.replace(/[^0-9]/g, "").slice(0, 6); set_otp({ myotp: otp });
                    if (otp.length === 6) { setIsVerifyDisabled(false) } else { setIsVerifyDisabled(true) }
                }} />
                <button disabled={isResendDisabled} onClick={resendEmail}>resendEmail</button>
                <button disabled={isVerifyDisabled} onClick={verify_email}>Continue</button>
            </div>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        )}

    </>
}

export default Register