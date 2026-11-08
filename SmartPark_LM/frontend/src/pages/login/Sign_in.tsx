import Register from "@components/login_layout/Register";
import Login from "@components/login_layout/Login";
import { F_LIGHT, F_MED } from "@/styles/Fonts_main.tsx";
import {
  cardBase,
  signinCard,
  registerCard,
  otpCard,
  link,
  socialBtn,
  socialIcon,
  socialLabel,
  otpInput,
  primaryBtn,
  main_log_in,
  left_panel,
  logo_h1,
  logo_h2,
  top_right_panel,
  right_panel_header,
  right_sign_in_text,
  right_sign_in_below,
  forgot_pass_word_style,
  social_btn_holder,
  seperator_other_ways,
  OTP_style_1,
  OTP_style_2
} from "@/styles/Sign_in_styles";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

interface Props {
  onSuccessProps: (uuid: string) => void;
}

type Screen = "signin" | "register" | "otp";

const OTP_LENGTH = 6;
const OTP_SECONDS = 5 * 60;

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ---------- shared class strings (Tailwind) ---------- */

// .screen / .screen.active
const screenCls = (active: boolean) =>
  `w-full items-center justify-center max-[860px]:items-stretch max-[860px]:justify-stretch ${active ? "flex" : "hidden"
  }`;

function Signin({ onSuccessProps }: Props) {
  const [screen, setScreen] = useState<Screen>("signin");
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Navigation helper for <a> links
  const goTo = (target: Screen) => (e: MouseEvent<HTMLAnchorElement>) => {
    console.log("goTo called:", target);
    setScreen(target);
  };

  // OTP countdown: only runs while the OTP screen is visible
  useEffect(() => {
    if (screen !== "otp") return;
    setSecondsLeft(OTP_SECONDS);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  const handleOtpInput = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.value && i < OTP_LENGTH - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const handleOtpKeyDown =
    (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value && i > 0) {
        otpRefs.current[i - 1]?.focus();
      }
    };

  const handleOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otpRefs.current.map((el) => el?.value ?? "").join("");
    if (code.length < OTP_LENGTH || secondsLeft === 0) return;
    // TODO: call your verify-OTP API with `code`
    setScreen("signin");
  };

  return (
    <main
      className={main_log_in}
    >
      {/* LEFT PANEL */}
      <aside
        className={left_panel}
      >
        <div>
          <h1
            className={logo_h1}
          >
            <span className="text-[105%] font-['Logo_font']">
              A <span className="text-[105%] font-['SF_Compact_light']">UPARK</span>
            </span>
          </h1>
          <p
            className={logo_h2}
          >
            Sign in or create an account
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <section
        className={top_right_panel}
      >
        {/* Sign in */}
        <div className={screenCls(screen === "signin")} id="signin">
          <div className={signinCard}>
            <p className={right_sign_in_text}>Sign in</p>
            <p
              className={right_sign_in_below}
            >
              New here?{" "}
              <a href="#" className={link} onClick={goTo("register")}>
                Create an account
              </a>
            </p>
            <Login onSuccess={onSuccessProps} />
            <div
              className={forgot_pass_word_style}
            >
              <span>Other ways to join</span>
            </div>
            <div
              className={social_btn_holder}
            >
              <button className={socialBtn} type="button">
                <span className={`${socialIcon} bg-[url('/logos/Google.png')]`}></span>
                <small className={socialLabel}>Google</small>
              </button>
              <button className={socialBtn} type="button">
                <span className={`${socialIcon} bg-[url('/logos/Facebook.png')]`}></span>
                <small className={socialLabel}>Facebook</small>
              </button>
              <button className={socialBtn} type="button">
                <span
                  className={`${socialIcon} bg-[url('/logos/Line.png')] rounded-[100px]`}
                ></span>
                <small className={socialLabel}>Line</small>
              </button>
            </div>
            <div
              className={seperator_other_ways}
            >
              <a href="#" className={link} onClick={goTo("otp")}>
                Trouble signing in?
              </a>
              <a href="#" className={link}>
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        {/* Register */}
        <div className={screenCls(screen === "register")} id="register">
          <div className={registerCard}>
            <p
              className={`${F_MED} text-[36px] font-normal text-[#333] mb-[34px]
                max-[860px]:text-[28px] max-[860px]:mb-[26px]`}
            >
              Register
            </p>
            <Register
              onBack={() => {
                setScreen("signin");
              }}

              onOTP={() => {
                setScreen("otp");
              }}
            />

          </div>
        </div>

        {/* OTP */}
        <div className={screenCls(screen === "otp")} id="otp">
          <div className={otpCard}>
            <h2
              className="text-[20px] font-semibold mb-[10px]
                min-[861px]:text-[clamp(20px,1.7vw,30px)] min-[861px]:mb-[clamp(10px,0.9vw,16px)]"
            >
              OTP
            </h2>
            <p
              className="text-[11px] text-[#888] leading-[1.6] mt-3 mb-[22px]
                min-[861px]:text-[clamp(12px,0.9vw,16px)] max-[860px]:text-[12px]"
            >
              Please enter OTP (One Time Password) verification number sent to
              your email / phone number with 5 minutes expiration time to
              complete this step within only 5 attempts
            </p>
            <form id="otp-form" onSubmit={handleOtp}>
              <div
                className="grid grid-cols-[repeat(6,minmax(0,1fr))] gap-[17.5px]
                  max-[860px]:gap-2 max-[380px]:gap-[5px]"
              >
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    className={otpInput}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={handleOtpInput(i)}
                    onKeyDown={handleOtpKeyDown(i)}
                  />
                ))}
              </div>
              <div
                className={OTP_style_1}
              >
                <span>
                  Remaining time:{" "}
                  <b id="otp-timer" className="font-normal text-[#2874df]">
                    {formatTime(secondsLeft)}
                  </b>
                </span>
                <span>
                  Didn't receive OTP?{" "}
                  <a
                    href="#"
                    id="resend"
                    className={link}
                    onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      setSecondsLeft(OTP_SECONDS);
                      // TODO: call your resend-OTP API
                    }}
                  >
                    Resend
                  </a>
                </span>
              </div>
              <button className={primaryBtn} disabled={secondsLeft === 0}>
                Verify
              </button>
            </form>
            <button
              className={OTP_style_2}
              id="otp-cancel"
              type="button"
              onClick={() => setScreen("signin")}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Signin;
