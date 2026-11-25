import Register from "@components/login_layout/Register";
import Login from "@components/login_layout/Login";
import { Icon } from "@iconify/react";
import { F_LIGHT, F_MED } from "@/styles/Fonts_main";
import { signInWithSocial, type SocialProviderName } from "@/services/firebase";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useT } from "@/i18n";

import { useEffect, useState, type MouseEvent } from "react";

interface Props {
  onSuccessProps: (uuid: string) => void;
}

type Screen = "signin" | "register";

const PAGE_ZOOM = 0.99;

const SOCIAL_PROVIDERS: { name: SocialProviderName; icon: string; scale: string; color: string }[] = [
  { name: "Google", icon: "thesvg-color:google", scale: "scale-110", color: "" },
  { name: "Facebook", icon: "selfhst:facebook", scale: "scale-110", color: "" },
];

const screenCls = (active: boolean, modal: boolean) =>
  `w-full items-center justify-center ${
    modal ? "" : "max-[860px]:items-stretch max-[860px]:justify-stretch"
  } ${active ? "flex" : "hidden"}`;

/* การ์ด Sign in: หน้าเต็ม (page) จะชิดขอบบนมือถือ / แบบ modal จะเป็นการ์ดลอยเสมอ */
const SIGNIN_CARD_BASE =
  "relative w-full bg-white border border-[#dedee3] rounded-[17.5px] [--pad-x:clamp(22px,3vw,47px)] max-w-[520px] px-[var(--pad-x)] py-[clamp(24px,3vw,39px)] min-[861px]:[--pad-x:clamp(36px,2.8vw,54px)] min-[861px]:max-w-[clamp(520px,34vw,620px)] min-[861px]:py-[clamp(30px,2.4vw,46px)]";
const SIGNIN_CARD_PAGE =
  "max-[860px]:flex-1 max-[860px]:max-w-none max-[860px]:border-0 max-[860px]:rounded-none max-[860px]:px-6 max-[860px]:pt-8 max-[860px]:pb-[calc(32px+env(safe-area-inset-bottom,0px))] max-[380px]:px-[18px]";
const SIGNIN_CARD_MODAL =
  "shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-[860px]:px-6 max-[860px]:py-8 max-[380px]:px-[18px]";

const REGISTER_CARD_BASE =
  "relative w-full bg-white border border-[#dedee3] rounded-[14px] max-w-[440px] px-[clamp(36px,2.8vw,54px)] py-[clamp(30px,2.4vw,46px)] min-[861px]:max-w-[clamp(520px,34vw,620px)]";
const REGISTER_CARD_PAGE =
  "max-[860px]:flex-1 max-[860px]:max-w-none max-[860px]:border-0 max-[860px]:rounded-none max-[860px]:px-6 max-[860px]:pt-8 max-[860px]:pb-[calc(32px+env(safe-area-inset-bottom,0px))] max-[380px]:px-[18px]";
const REGISTER_CARD_MODAL =
  "shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-[860px]:px-6 max-[860px]:py-8 max-[380px]:px-[18px]";

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#6F6F72] transition-colors hover:bg-gray-100 active:bg-gray-200"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
        <path d="M5 5l14 14M19 5L5 19" />
      </svg>
    </button>
  );
}

/* ============================================================
   AuthCard — ตัวฟอร์ม Sign in / Register (ใช้ทั้งหน้าเต็มและ modal)
   ============================================================ */

interface AuthCardProps extends Props {
  modal?: boolean;
  onClose?: () => void;
}

function AuthCard({ onSuccessProps, modal = false, onClose }: AuthCardProps) {
  const t = useT();
  const [screen, setScreen] = useState<Screen>("signin");
  // ใช้ซ่อนหัวข้อ "Register" ตอน Register อยู่หน้า OTP (กันซ้อนกัน)
  const [registerPage, setRegisterPage] = useState<"register" | "otp">("register");

  const [socialBusy, setSocialBusy] = useState(false);
  const [socialError, setSocialError] = useState("");

  const handleSocial = async (name: SocialProviderName) => {
    if (socialBusy) return;
    setSocialBusy(true);
    setSocialError("");
    try {
      const user = await signInWithSocial(name);
      localStorage.setItem("token", user.uid);
      onSuccessProps(user.uid);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setSocialError(t("signin.socialFailed", { name }));
      }
    } finally {
      setSocialBusy(false);
    }
  };

  const goTo = (target: Screen) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setScreen(target);
  };

  return (
    <>
      {/* Sign in */}
      <div className={screenCls(screen === "signin", modal)} id="signin">
        <div className={`${SIGNIN_CARD_BASE} ${modal ? SIGNIN_CARD_MODAL : SIGNIN_CARD_PAGE}`}>
          {modal && onClose && <CloseButton onClick={onClose} />}

          <p className={`${F_MED} text-[225%] leading-tight text-black max-[860px]:text-[28px]`}>{t("signin.title")}</p>
          <p
            className={`${F_LIGHT} text-[10px] text-[#0F172A] mt-[18px] mb-[38.5px] min-[861px]:text-[clamp(11px,0.9vw,15px)] max-[860px]:text-[13px] max-[860px]:mb-6`}
          >
            {t("signin.newHere")}{" "}
            <a href="#" className="text-[#1487F0] underline cursor-pointer" onClick={goTo("register")}>
              {t("signin.createAccount")}
            </a>
          </p>

          <Login onSuccess={onSuccessProps} />

          <div className="flex items-center gap-[10px] mt-[45px] mb-10 mx-[calc(var(--pad-x,36px)_*_-0.9)] text-[10px] whitespace-nowrap before:content-[''] before:h-px before:flex-1 before:bg-[#e7e7eb] after:content-[''] after:h-px after:flex-1 after:bg-[#e7e7eb] min-[861px]:text-[clamp(10px,0.9vw,14.5px)] max-[860px]:mx-0 max-[860px]:mt-8 max-[860px]:mb-6 max-[860px]:text-[12px]">
            <span>{t("signin.otherWays")}</span>
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="grid w-full grid-cols-2 gap-3 max-[860px]:gap-2.5">
            {SOCIAL_PROVIDERS.map((p) => (
              <button
                key={p.name}
                type="button"
                aria-label={t("signin.continueWith", { name: p.name })}
                disabled={socialBusy}
                onClick={() => handleSocial(p.name)}
                className="flex min-w-0 flex-col items-center justify-start gap-5.5 rounded-lg border border-gray-200 bg-white px-1 pt-6 pb-6 transition-colors hover:bg-gray-50 active:bg-gray-100 max-[860px]:gap-3 max-[860px]:pt-3 max-[860px]:pb-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center max-[860px]:h-8 max-[860px]:w-8">
                  <Icon icon={p.icon} className={`block h-full w-full ${p.scale} ${p.color}`} />
                </span>
                <span className="block w-full truncate text-center text-[14px] font-medium leading-normal text-[#6F6F72] max-[860px]:text-[11px]">
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {socialError && (
            <p role="alert" className="mt-3 text-center text-[13px] text-red-600">
              {socialError}
            </p>
          )}

          <div className="grid justify-center text-center gap-[10px] mt-[50px] text-[12px] min-[861px]:text-[clamp(10px,0.9vw,14.5px)] max-[860px]:text-[13px] max-[860px]:mt-8">
            <a
              href="#"
              className="text-[#1487F0] underline cursor-pointer inline-block translate-y-3"
              onClick={(e) => e.preventDefault()} // TODO: หน้า forgot password
            >
              {t("signin.troubleSigningIn")}
            </a>
            <a
              href="#"
              className="text-[#1487F0] underline cursor-pointer inline-block translate-y-3"
              onClick={(e) => e.preventDefault()}
            >
              {t("signin.privacy")}
            </a>
          </div>
        </div>
      </div>

      {/* Register (มี OTP ของตัวเองอยู่ข้างใน) */}
      <div className={screenCls(screen === "register", modal)} id="register">
        <div className={`${REGISTER_CARD_BASE} ${modal ? REGISTER_CARD_MODAL : REGISTER_CARD_PAGE}`}>
          {modal && onClose && <CloseButton onClick={onClose} />}

          {registerPage === "register" && (
            <p className={`${F_MED} text-[36px] text-[#333] mb-[34px] max-[860px]:text-[28px] max-[860px]:mb-[26px]`}>
              {t("signin.registerTitle")}
            </p>
          )}
          <Register onBack={() => setScreen("signin")} onPageChange={setRegisterPage} />
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SigninModal — การ์ดลอยกลางจอ ทับหน้า Home (ตาม Figma)
   ============================================================ */

interface ModalProps extends Props {
  onClose: () => void;
}

export function SigninModal({ onSuccessProps, onClose }: ModalProps) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // กันหน้าหลังเลื่อน

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("signin.title")}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/25"
    >
      {/* กดพื้นที่ว่างรอบการ์ด = ปิด */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="flex w-full max-w-[clamp(520px,34vw,620px)] justify-center max-[860px]:max-w-[520px]">
          <AuthCard onSuccessProps={onSuccessProps} modal onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Signin — หน้าเต็ม (route /signin เดิม ยังใช้ได้)
   ============================================================ */

function Signin({ onSuccessProps }: Props) {
  const t = useT();

  return (
    <main
      className="grid min-h-dvh grid-cols-[minmax(0,52.2%)_minmax(0,47.8%)] max-[1100px]:grid-cols-[minmax(0,40%)_minmax(0,60%)] max-[860px]:grid-cols-[minmax(0,1fr)] max-[860px]:grid-rows-[auto_1fr]"
      style={{ zoom: PAGE_ZOOM, minHeight: `calc(100vh / ${PAGE_ZOOM})` }}
    >
      {/* LEFT PANEL */}
      <aside
        className={`relative flex min-h-dvh items-center bg-black text-white pl-[9%] ${F_LIGHT} max-[1100px]:pl-[6%] max-[860px]:min-h-0 max-[860px]:px-[8%] max-[860px]:py-[25px]`}
      >
        <LanguageSwitch className="absolute left-3 top-3" />
        <div>
          <h1 className="flex items-center gap-[0.3em] text-[clamp(28px,2.5vw,56px)] font-light tracking-[0.01em] leading-[1.1] uppercase min-[861px]:text-[clamp(28px,3vw,64px)] max-[860px]:text-[25px]">
            <span className="font-logo text-[95.5%]">
              A <span className="font-sans font-light text-[95.5%]">UPARK</span>
            </span>
          </h1>
          <p className="block mt-[0.7em] text-[clamp(16px,1.65vw,34px)] font-[350] tracking-[0.04em] leading-[1.2] text-white min-[861px]:text-[clamp(16px,2vw,40px)] max-[860px]:mt-3 max-[860px]:text-[18px]">
            {t("signin.subtitle")}
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <section className="relative flex min-h-dvh min-w-0 items-center justify-center bg-[#f5f5f7] px-6 pt-[35px] pb-[55px] max-[860px]:min-h-0 max-[860px]:p-0 max-[860px]:bg-white max-[860px]:items-stretch max-[860px]:justify-stretch">
        <AuthCard onSuccessProps={onSuccessProps} />
      </section>
    </main>
  );
}

export default Signin;