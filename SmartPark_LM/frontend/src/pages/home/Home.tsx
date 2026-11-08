import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import Register from "@components/login_layout/Register";

type Screen = "signin" | "register" | "otp";

const OTP_SECONDS = 300;
const OTP_LENGTH = 6;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [secondsLeft, setSecondsLeft] = useState<number>(OTP_SECONDS);

  // Reset and run the OTP countdown while the OTP screen is open
  useEffect(() => {
    if (screen !== "otp") return;
    setSecondsLeft(OTP_SECONDS);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  const formatTime = (s: number): string => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}s`;
  };

  const goTo =
    (target: Screen) =>
      (e: MouseEvent<HTMLAnchorElement>): void => {
        console.log("goTo called:", target);
        setScreen(target);
      };

  const handleSignin = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
  };

  const handleRegister = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const pw = (document.getElementById("reg-password") as HTMLInputElement | null)
      ?.value;
    const confirm = (
      document.getElementById("confirm-password") as HTMLInputElement | null
    )?.value;
    if (pw !== confirm) {
      alert("Passwords do not match");
    }
  };

  const handleOtp = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
  };

  const handleOtpInput = (e: ChangeEvent<HTMLInputElement>): void => {
    // Auto-advance to next box
    const next = e.target.nextElementSibling as HTMLInputElement | null;
    if (e.target.value && next) {
      next.focus();
    }
  };

  return (
    <main className="layout">
      <aside className="brand">
        <div className="brand-content">
          <h1 className="brand-logo">
            <span className="Logo-A">
              A <span className="LightSF">UPARK</span>
            </span>
          </h1>
          <p>Sign in or create an account</p>
        </div>
      </aside>

      <section className="right-panel">
        {/* Sign in */}
        <div
          className={`screen ${screen === "signin" ? "active" : ""}`}
          id="signin"
        >
          <div className="card signin-card">
            <p className="SFPro_med">Sign in</p>
            <p className="new-user">
              New here?{" "}
              <a href="#" onClick={goTo("register")}>
                Create an account
              </a>
            </p>
            <form id="signin-form" onSubmit={handleSignin}>
              <label className="sr-only" htmlFor="signin-email-input">
                Email address
              </label>
              <input
                autoComplete="email"
                id="signin-email-input"
                placeholder="Email address"
                required
                type="email"
              />
              <label className="sr-only" htmlFor="signin-password-input">
                Password
              </label>
              <input
                autoComplete="current-password"
                id="signin-password-input"
                placeholder="Password"
                required
                type="password"
              />
              <button className="primary-btn">Continue</button>
              <div className="forgot">
                <a href="#" onClick={goTo("otp")}>
                  Forgot password?
                </a>
              </div>
            </form>
            <div className="separator">
              <span>Other ways to join</span>
            </div>
            <div className="socials">
              <button className="social-btn" type="button">
                <span className="google"></span>
                <small>Google</small>
              </button>
              <button className="social-btn" type="button">
                <span className="facebook"></span>
                <small>Facebook</small>
              </button>
              <button className="social-btn" type="button">
                <span className="line"></span>
                <small>Line</small>
              </button>
            </div>
            <div className="footer-links">
              <a href="#" onClick={goTo("otp")}>
                Trouble signing in?
              </a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* Register */}
        <div className={`screen ${screen === "register" ? "active" : ""}`} id="register">
          <Register
            onBack={() => {
              setScreen("signin");
            }}

            onOTP={() => {
              setScreen("otp");
            }}
          />
        </div>

        {/* OTP */}
        <div
          className={`screen ${screen === "otp" ? "active" : ""}`}
          id="otp"
        >
          <div className="card otp-card">
            <h2>OTP</h2>
            <p className="otp-description">
              Please enter OTP (One Time Password) verification number sent to
              your email / phone number with 5 minutes expiration time to
              complete this step within only 5 attempts
            </p>
            <form id="otp-form" onSubmit={handleOtp}>
              <div className="otp-inputs">
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                  <input
                    key={i}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={handleOtpInput}
                  />
                ))}
              </div>
              <div className="otp-info">
                <span>
                  Remaining time: <b id="otp-timer">{formatTime(secondsLeft)}</b>
                </span>
                <span>
                  Didn't receive OTP?{" "}
                  <a
                    href="#"
                    id="resend"
                    onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      setSecondsLeft(OTP_SECONDS);
                    }}
                  >
                    Resend
                  </a>
                </span>
              </div>
              <button className="primary-btn">Verify</button>
            </form>
            <button
              className="cancel-btn"
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
