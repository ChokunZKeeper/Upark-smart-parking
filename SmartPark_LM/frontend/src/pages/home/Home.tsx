<<<<<<< HEAD
import { useCallback, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  What_can_Upark_do_layer,
  What_uses_UPARK,
} from "@/assets/layer/AllLayer";
import LogoAnimation from "@/assets/logos/Logo_Animation.webm";
import PillSelect, { type Option } from "@/styles/Dropdown";
import { useT, useI18n, type Lang } from "@/i18n";
import { SigninModal } from "@/pages/login/Sign_in";

/* ============================================================
   Constants
   ============================================================ */

const fLight = "font-sans font-light";
const fReg = "font-sans font-normal";
const fMed = "font-sans font-medium";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a72d9] focus-visible:outline-offset-[3px]";

// เส้นตัดใต้ nav — เข้มตรงกลาง เรียวจางหายที่ปลายซ้าย-ขวา
const LINE_GRADIENT =
  "radial-gradient(ellipse closest-side at 50% 50%, #D2D2D7 50%, rgba(236, 236, 250, 0) 100%)";

/* ============================================================
   Language dropdown (ใช้ PillSelect ของโปรเจกต์)
   ============================================================ */

function TranslateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[22px] fill-none stroke-current"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h9M7.5 3v2M5 9c1 2.5 3 4.5 5.5 5.5M11 5c-.5 3-2.5 6-6 8.5" />
      <path d="M13 21l4.5-10L22 21M14.8 17h5.4" />
    </svg>
  );
}

// ลูกศร ▼ ชิดขวาในปุ่ม (PillSelect ไม่มีลูกศรให้เอง ต้องส่งผ่าน prop arrow)
function ArrowDown() {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className="pointer-events-none absolute right-2 top-1/2 size-[10px] -translate-y-1/2 fill-current"
    >
      <path d="M1 2.5h8L5 8 1 2.5Z" />
    </svg>
  );
}

// ชื่อภาษาใช้ชื่อของภาษานั้นเอง จึงไม่ต้องแปล
const LANGUAGES: Option<Lang>[] = [
  { value: "en", label: "English", icon: <TranslateIcon /> },
  { value: "th", label: "ไทย", icon: <TranslateIcon /> },
];

// ปุ่ม: พื้นโปร่ง ไม่มีขอบ และไม่เปลี่ยนสีตอน hover / ตอนกดเปิด
const LANG_BUTTON_STYLE = {
  "--dropdown-bg": "transparent",
  "--dropdown-border": "transparent",
  "--dropdown-text": "#2b2b2e",
  "--hover-dropdown-bg": "transparent",
  "--hover-dropdown-border": "transparent",
  "--hover-dropdown-text": "#2b2b2e",
} as CSSProperties;

// แผงรายการ: พื้นขาว ขอบเทาอ่อน แถบไฮไลต์เทาอ่อน
// (แผงอยู่ใน portal จึงส่งสีผ่าน panelClassName)
const LANG_PANEL_CLASS =
  "min-w-[170px] [--dropdown-bg:#ffffff] [--dropdown-border:#e5e5ea] [--dropdown-text:#2b2b2e] [--hover-dropdown-bg:#f0f0f3] [--hover-dropdown-border:transparent] [--hover-dropdown-text:#2b2b2e]";

function LanguageMenu() {
  // useI18n() คืน { lang, setLang, t } จาก '@/i18n'
  const { lang, setLang } = useI18n();

  return (
    <div style={LANG_BUTTON_STYLE}>
      <PillSelect<Lang>
        value={lang}
        onChange={(v) => setLang(v)}
        options={LANGUAGES}
        ariaLabel="Language"
        widthClass="w-[150px] max-md:w-[130px]"
        triggerClassName="h-[34px] rounded-full text-[15px] !text-left !pr-7"
        panelClassName={LANG_PANEL_CLASS}
        arrow={<ArrowDown />}
      />
    </div>
  );
}

/* ============================================================
   1 — Hero
   ============================================================ */

function Nav({ onLogin }: { onLogin: () => void }) {
  const t = useT();

  return (
    <nav
      aria-label="Primary"
      className={`relative z-20 flex h-10.5 shrink-0 items-center justify-center gap-[70px] bg-white text-sm text-[#0F172A] ${fReg}`}
    >
      <a href="#faq" className={focusRing}>
        {t("home.nav.faq")}
      </a>

      {/* กด Login → เปิดการ์ด Sign in ทับหน้านี้ */}
      <button
        type="button"
        onClick={onLogin}
        className={`cursor-pointer ${focusRing}`}
      >
        {t("home.nav.login")}
      </button>

      {/* ตัวเลือกภาษา — มุมขวา (แผงรายการกางไปทางซ้าย อยู่ในจอพอดี) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 max-md:right-2">
        <LanguageMenu />
      </div>
    </nav>
  );
}

function Hero({ onOpenSignin }: { onOpenSignin: () => void }) {
  const t = useT();

  return (
    <header className="flex min-h-[max(760px,100vh)] flex-col bg-white max-md:min-h-0">
      <Nav onLogin={onOpenSignin} />

      {/* เส้นตัดใต้ nav */}
      <div
        aria-hidden="true"
        className="h-px w-full shrink-0"
        style={{ backgroundImage: LINE_GRADIENT }}
      />

      {/* Logo + Title */}
      <div className="flex flex-1 flex-col items-center justify-start bg-[#f4f4f6] px-6 pb-16 pt-[115px] text-[#111827] max-xl:pt-[160px] max-md:min-h-[480px] max-md:pt-[24px]">
        <video
          src={LogoAnimation}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-label="UPARK Logo Animation"
          className="h-auto w-[720px] max-w-full object-contain mix-blend-darken max-xl:w-[560px] max-md:w-full"
        />

        <h1
          className={`-mt-[80px] text-center text-[28px] leading-[10px] max-xl:-mt-[76px] max-md:-mt-[20px] ${fReg}`}
        >
          {t("home.hero.tagline")}
        </h1>
      </div>

      {/* Get started */}
      <div className="flex shrink-0 flex-col items-center bg-white px-6 pb-[40px] pt-8">
        <button
          className={`h-[70px] min-w-[187px] cursor-pointer whitespace-nowrap rounded-[13px] bg-[#2a72d9] px-6 text-[24px] text-white transition-colors duration-150 hover:bg-[#1f63c4] ${fReg} ${focusRing}`}
          onClick={onOpenSignin}
        >
          {t("home.hero.getStarted")}
        </button>

        <p
          className={`mt-[29px] text-center text-[15px] leading-[25px] text-[#323232] ${fLight}`}
        >
          <span>{t("home.hero.line1")}</span>
          <br />
          <span>{t("home.hero.line2")}</span>
        </p>
      </div>
    </header>
  );
}

/* ============================================================
   2 — What can UPark do / What is UPark
   ============================================================ */

function Features() {
  const t = useT();

  return (
    <section className="mx-auto mt-[213px] w-[1027px] max-w-full max-lg:mt-16 max-lg:px-4">
      {/* การ์ด 1: What can UPark do? */}
      <div className="grid min-h-[512px] grid-cols-2 overflow-hidden rounded-[19px] bg-white max-lg:h-auto max-lg:grid-cols-1">
        {/* พื้นเทา */}
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#141414_5%,#4B4B4B_24%)] max-lg:flex max-lg:h-[220px] max-lg:items-center max-lg:justify-center max-sm:h-[180px]">
          <What_can_Upark_do_layer
            aria-hidden="true"
            className="absolute left-7 top-7 h-[130%] w-auto max-w-none max-lg:hidden"
          />

          <h3
            className={`hidden px-6 text-center text-[26px] leading-[30px] text-white max-lg:block max-sm:text-[22px] ${fMed}`}
          >
            {t("home.whatCan.title")}
          </h3>
        </div>

        {/* ข้อความ */}
        <div className="flex flex-col justify-start px-[42px] pt-[90px] max-lg:px-6 max-lg:py-[45px]">
          <h3 className={`mb-[29px] text-[26px] leading-[30px] max-lg:hidden ${fMed}`}>
            {t("home.whatCan.title")}
          </h3>

          <p
            className={`text-[17px] leading-[28px] text-[#3c3c40] max-sm:text-[15px] max-sm:leading-[26px] ${fLight}`}
          >
            {t("home.whatCan.body")}
          </p>
        </div>
      </div>

      {/* การ์ด 2: What is UPark? */}
      <div className="mt-8 grid min-h-[350px] grid-cols-2 overflow-hidden rounded-[19px] bg-white max-lg:h-auto max-lg:grid-cols-1">
        {/* ข้อความ */}
        <div className="flex flex-col justify-start px-[42px] pt-12 max-lg:px-6 max-lg:py-[45px]">
          <h3 className={`mb-[29px] text-[26px] leading-[30px] max-lg:hidden ${fMed}`}>
            {t("home.whatIs.title")}
          </h3>

          <p
            className={`text-[17px] leading-[28px] text-[#3c3c40] max-sm:text-[15px] max-sm:leading-[26px] ${fLight}`}
          >
            {t("home.whatIs.body")}
          </p>
        </div>

        {/* พื้นฟ้า */}
        <div className="relative grid place-items-center overflow-hidden bg-[linear-gradient(180deg,#84bcff_0%,#2a8cff_100%)] max-lg:order-first max-lg:flex max-lg:h-[220px] max-lg:items-center max-lg:justify-center max-sm:h-[180px]">
          <What_uses_UPARK
            aria-hidden="true"
            className="block h-auto w-[300px] max-w-[45%] max-lg:hidden"
          />

          <h3
            className={`hidden px-6 text-center text-[26px] leading-[30px] text-white max-lg:block max-sm:text-[22px] ${fMed}`}
          >
            {t("home.whatIs.title")}
          </h3>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3 — Who uses UPark
   ============================================================ */

function WhoUses() {
  const t = useT();
  const highlight = "not-italic text-[#2f7be0]";

  return (
    <section className="mx-auto w-[1027px] max-w-full max-md:px-4">
      <div className="mt-8 overflow-hidden rounded-[19px] bg-white pb-[54px] pl-[51px] pr-[35px] pt-[51px] max-md:px-[38px] max-md:py-[45px]">
        <h3 className={`mb-[30px] text-[26px] leading-[30px] ${fMed}`}>
          {t("home.who.title")}
        </h3>

        <p className="text-[17px] leading-[28px] text-[#3c3c40]">
          {t("home.who.p1Pre")} <em className={highlight}>{t("home.who.p1Em")}</em>{" "}
          {t("home.who.p1Post")}
        </p>

        <p className="mt-[26px] text-[17px] leading-[28px] text-[#3c3c40]">
          {t("home.who.p2Pre")} <em className={highlight}>{t("home.who.p2Em1")}</em>{" "}
          {t("home.who.p2Mid")} <em className={highlight}>{t("home.who.p2Em2")}</em>
          {t("home.who.p2Post")}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   4 — Hardware + Footer
   ============================================================ */

function Hardware() {
  const t = useT();
  const body = `mx-auto mt-8 max-w-[1043px] text-[19px] leading-8 text-[#8b8b8f] ${fLight}`;

  return (
    <section className="mt-36 min-h-[672px] bg-black px-[38px] pt-[77px] text-center text-white">
      <h2 className={`text-[32px] leading-[38px] ${fMed}`}>
        {t("home.hardware.title")}
      </h2>

      <p className={body}>
        {t("home.hardware.p1Pre")}
        <b className="text-white">{t("home.hardware.p1Bold")}</b>
        {t("home.hardware.p1Post")}
      </p>

      <p className={body}>
        <b className={`text-white ${fMed}`}>{t("home.hardware.important")}</b> :{" "}
        <span className="text-white">{t("home.hardware.p2")}</span>
      </p>
    </section>
  );
}

const FOOTER_LINKS = [
  { href: "#privacy", labelKey: "home.footer.privacy" },
  { href: "#terms", labelKey: "home.footer.terms" },
  { href: "#legal", labelKey: "home.footer.legal" },
  { href: "#contact", labelKey: "home.footer.contact" },
];

function Footer() {
  const t = useT();

  return (
    <footer
      className={`flex h-[90px] items-center bg-[#161616] pl-[42px] pr-[19px] text-base text-[#d8d8da] max-md:h-auto max-md:flex-wrap max-md:gap-[19px] max-md:p-8 ${fLight}`}
    >
      <span className="mr-[86px] max-md:mr-0 max-md:w-full">
        {t("home.footer.copyright")}
      </span>

      <nav
        aria-label="Footer"
        className="flex gap-[61px] max-md:flex-wrap max-md:gap-x-6 max-md:gap-y-4"
      >
        {FOOTER_LINKS.map((link) => (
          <a key={link.href} href={link.href} className={focusRing}>
            {t(link.labelKey)}
          </a>
        ))}
      </nav>
    </footer>
  );
}

/* ============================================================
   Page
   ============================================================ */

interface HomeProps {
  /** handleSuccess จาก router (App.tsx) → navigate(`/system/${uuid}`) */
  onSuccessProps?: (uuid: string) => void;
}

export default function Home({ onSuccessProps }: HomeProps) {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  // เรียกเมื่อ login ถูกต้อง (อีเมล/รหัสผ่านผ่าน หรือ Google/Facebook ผ่าน)
  const handleSuccess = useCallback(
    (uuid: string) => {
      setAuthOpen(false);
      if (onSuccessProps) onSuccessProps(uuid);
      else navigate(`/system/${uuid}`);
    },
    [onSuccessProps, navigate],
  );

  return (
    <div
      className={`min-h-[80vh] overflow-x-clip bg-[#f4f4f6] text-[#2b2b2e] antialiased [font-synthesis:none] ${fLight}`}
    >
      <Hero onOpenSignin={openAuth} />
      <Features />
      <WhoUses />
      <Hardware />
      <Footer />

      {authOpen && <SigninModal onSuccessProps={handleSuccess} onClose={closeAuth} />}
    </div>
  );
}
=======
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
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
