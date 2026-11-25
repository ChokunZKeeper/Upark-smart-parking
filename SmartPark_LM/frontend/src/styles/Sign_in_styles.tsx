<<<<<<< HEAD
import {F_LIGHT, F_MED} from "./Fonts_main.tsx";
// Mobile (<=860px) full-bleed card + very small screens
=======
import { F_LIGHT, F_MED } from "./Fonts_main";

/* ---------- สไตล์ของ <form> ภายใน Login / Register ----------
   มีผลเฉพาะในการ์ดที่ใส่ class นี้ ไม่กระทบหน้าอื่น
   (ตรงกับ #signin-form / #register-form ของ CSS ต้นแบบ) */
const IN = "[&_input:not([type=checkbox])]";
const BTN = "[&_form_button:not([type=button])]";

const formScope =
  "[&_form]:grid [&_form]:gap-[14px] " +
  // label
  "[&_label]:font-sans [&_label]:font-light [&_label]:text-[clamp(13px,0.95vw,15px)] [&_label]:text-[#333] " +
  // input
  `${IN}:block ${IN}:w-full ${IN}:h-[clamp(38px,2.6vw,46px)] ${IN}:px-[14px] ${IN}:bg-white ` +
  `${IN}:font-sans ${IN}:font-light ${IN}:text-[clamp(16px,1.05vw,18px)] ${IN}:text-[#0F172A] ` +
  `${IN}:border ${IN}:border-solid ${IN}:border-[#dedee3] ${IN}:rounded-lg ${IN}:outline-none ` +
  `${IN}:placeholder:text-[#88888b] ${IN}:placeholder:opacity-100 ${IN}:focus:border-[#8db7ef] ` +
  // ปุ่ม submit (Continue / Register)
  `${BTN}:w-full ${BTN}:h-[clamp(40px,2.7vw,48px)] ${BTN}:mt-2 ${BTN}:rounded-[9px] ${BTN}:border-0 ` +
  `${BTN}:bg-[#2874df] ${BTN}:text-white ${BTN}:font-sans ${BTN}:font-light ` +
  `${BTN}:text-[clamp(15px,1vw,18px)] ${BTN}:cursor-pointer ` +
  `${BTN}:hover:bg-[#1d65c8] ${BTN}:disabled:opacity-60 ` +
  // ลิงก์ในฟอร์ม (เช่น Forgot password?)
  "[&_form_a]:text-[#1487F0] [&_form_a]:underline [&_form_a]:cursor-pointer";

/* ---------- Cards ---------- */

>>>>>>> 901b25f (update 2)
export const cardMobile =
  "max-[860px]:flex-1 max-[860px]:max-w-none max-[860px]:border-0 max-[860px]:rounded-none " +
  "max-[860px]:px-6 max-[860px]:pt-8 max-[860px]:pb-[calc(32px+env(safe-area-inset-bottom,0px))] " +
  "max-[380px]:px-[18px]";

<<<<<<< HEAD
// .card
export const cardBase =
  "w-full bg-white border border-[#dedee3] rounded-[17.5px] " +
  "max-w-[440px] px-9 py-[30px] " +
  "min-[861px]:max-w-[clamp(440px,34vw,620px)] " +
  "min-[861px]:px-[clamp(36px,2.8vw,54px)] min-[861px]:py-[clamp(30px,2.4vw,46px)] " +
  cardMobile;

// .card.signin-card
=======
>>>>>>> 901b25f (update 2)
export const signinCard =
  "w-full bg-white border border-[#dedee3] rounded-[17.5px] " +
  "[--pad-x:clamp(22px,3vw,47px)] max-w-[520px] " +
  "px-[var(--pad-x)] py-[clamp(24px,3vw,39px)] " +
  "min-[861px]:[--pad-x:clamp(36px,2.8vw,54px)] " +
  "min-[861px]:max-w-[clamp(520px,34vw,620px)] " +
  "min-[861px]:py-[clamp(30px,2.4vw,46px)] " +
<<<<<<< HEAD
  cardMobile;

// .card.register-card
=======
  cardMobile + " " + formScope;

>>>>>>> 901b25f (update 2)
export const registerCard =
  "w-full bg-white border border-[#dedee3] rounded-[14px] " +
  "max-w-[440px] px-[clamp(36px,2.8vw,54px)] py-[clamp(30px,2.4vw,46px)] " +
  "min-[861px]:max-w-[clamp(520px,34vw,620px)] " +
<<<<<<< HEAD
  cardMobile;

// .card.otp-card
=======
  cardMobile + " " + formScope;

>>>>>>> 901b25f (update 2)
export const otpCard =
  "w-full bg-white border border-[#dedee3] rounded-[17.5px] " +
  "max-w-[460px] px-9 py-[30px] " +
  "min-[861px]:max-w-[clamp(440px,34vw,620px)] " +
  "min-[861px]:px-[clamp(36px,2.8vw,54px)] min-[861px]:py-[clamp(30px,2.4vw,46px)] " +
  cardMobile;

<<<<<<< HEAD
// a:link
export const link = "text-[#1487F0] underline cursor-pointer";

// social buttons
=======
/* ---------- Links / buttons ---------- */

export const link = "text-[#1487F0] underline cursor-pointer";

export const primaryBtn =
  "w-full h-[35px] mt-[10px] bg-[#2874df] text-white text-[14px] border-0 rounded-md cursor-pointer " +
  "hover:bg-[#1d65c8] disabled:cursor-not-allowed disabled:opacity-60 " +
  "min-[861px]:h-[clamp(44px,3.1vw,54px)] min-[861px]:text-[clamp(15px,1vw,18px)]";

/* ---------- Social ---------- */

>>>>>>> 901b25f (update 2)
export const socialBtn =
  "flex w-full min-w-0 h-auto aspect-square max-h-[135px] flex-col items-center justify-center " +
  "gap-[clamp(8px,1.2vw,16px)] px-1 py-2 border border-[#dedee3] rounded-lg bg-white cursor-pointer " +
  "max-[860px]:max-h-[110px]";
<<<<<<< HEAD
export const socialIcon =
  "grid place-items-center w-9 h-9 flex-none aspect-square bg-no-repeat bg-center bg-contain " +
  "border-0 cursor-pointer -indent-[9999px] overflow-hidden " +
  "min-[861px]:w-[clamp(36px,2.6vw,46px)] min-[861px]:h-[clamp(36px,2.6vw,46px)]";
export const socialLabel =
  "text-[12px] min-[861px]:text-[clamp(12px,0.9vw,16px)] max-[380px]:text-[11px]";

// OTP
export const otpInput =
  "w-full min-w-0 mt-[10px] h-12 p-0 text-center text-[18px] border border-[#dedee3] rounded-md " +
  "outline-none focus:border-[#8db7ef] " +
  "min-[861px]:h-[clamp(48px,3.6vw,64px)] min-[861px]:text-[clamp(18px,1.4vw,26px)]";

export const primaryBtn =
  "w-full h-[35px] mt-[10px] bg-[#2874df] text-white text-[14px] border-0 rounded-md cursor-pointer " +
  "hover:bg-[#1d65c8] " +
  "min-[861px]:h-[clamp(44px,3.1vw,54px)] min-[861px]:text-[clamp(15px,1vw,18px)]";

export const main_log_in = "grid min-h-dvh grid-cols-[minmax(0,52.2%)_minmax(0,47.8%)]max-[1100px]:grid-cols-[minmax(0,40%)_minmax(0,60%)]max-[860px]:grid-cols-[minmax(0,1fr)] max-[860px]:grid-rows-[auto_1fr]"

export const left_panel = `relative flex min-h-dvh items-center bg-black text-white pl-[9%] ${F_LIGHT}
          max-[1100px]:pl-[6%]
          max-[860px]:min-h-0 max-[860px]:px-[8%] max-[860px]:py-[25px]`

export const logo_h1 = "flex items-center gap-[0.3em] text-[clamp(28px,2.5vw,56px)] font-light tracking-[0.01em] leading-[1.1] uppercase min-[861px]:text-[clamp(28px,3vw,64px)] max-[860px]:text-[25px]"

export const logo_h2 = "block mt-[0.7em] text-[clamp(16px,1.65vw,34px)] font-[350] tracking-[0.04em] leading-[1.2] text-white min-[861px]:text-[clamp(16px,2vw,40px)] max-[860px]:mt-3 max-[860px]:text-[18px]"

export const top_right_panel = "relative flex min-h-dvh min-w-0 items-center justify-center bg-[#f5f5f7] px-6 pt-[35px] pb-[55px] max-[860px]:min-h-0 max-[860px]:p-0 max-[860px]:bg-white max-[860px]:items-stretch max-[860px]:justify-stretch"

export const right_panel_header = "relative flex min-h-dvh min-w-0 items-center justify-center bg-[#f5f5f7] px-6 pt-[35px] pb-[55px] max-[860px]:min-h-0 max-[860px]:p-0 max-[860px]:bg-white max-[860px]:items-stretch max-[860px]:justify-stretch"

export const right_sign_in_text = `${F_MED} text-[225%] max-[860px]:text-[28px]`

export const right_sign_in_below = `${F_LIGHT} text-[10px] text-[#0F172A] mt-[18px] mb-[38.5px]
min-[861px]:text-[clamp(11px,0.9vw,15px)]
max-[860px]:text-[13px] max-[860px]:mb-6`

export const forgot_pass_word_style = `flex items-center gap-[10px] mt-[45px] mb-10
mx-[calc(var(--pad-x,36px)_*_-0.9)] text-[10px] whitespace-nowrap
before:content-[''] before:h-px before:flex-1 before:bg-[#e7e7eb]
after:content-[''] after:h-px after:flex-1 after:bg-[#e7e7eb]
min-[861px]:text-[clamp(10px,0.9vw,14.5px)]
max-[860px]:mx-0 max-[860px]:mt-8 max-[860px]:mb-6 max-[860px]:text-[12px]`

export const social_btn_holder = 'grid w-full justify-center gap-[14px] grid-cols-[repeat(3,minmax(0,150px))] max-[860px]:grid-cols-[repeat(3,minmax(0,1fr))] max-[860px]:gap-[10px] max-[380px]:gap-[6px]'

export const seperator_other_ways = 'grid justify-center text-center gap-[10px] mt-[50px] text-[12px] min-[861px]:text-[clamp(10px,0.9vw,14.5px)] max-[860px]:text-[13px] max-[860px]:mt-8'

export const OTP_style_1 = "flex flex-wrap justify-between gap-2 mt-[50px] mb-[10px] text-[11px] text-[#888] min-[861px]:text-[clamp(12px,0.9vw,16px)] max-[860px]:text-[12px]"

export const OTP_style_2 = "block mx-auto mt-[14px] border-0 bg-transparent text-[#999] text-[12px] cursor-pointer min-[861px]:text-[clamp(12px,0.95vw,16px)]"
=======

// ใช้ <span> ว่าง ๆ + background-image (ไม่มี indent/ข้อความให้ซ่อน)
export const socialIcon =
  "block w-9 h-9 flex-none bg-no-repeat bg-center bg-contain " +
  "min-[861px]:w-[clamp(36px,2.6vw,46px)] min-[861px]:h-[clamp(36px,2.6vw,46px)]";

export const socialLabel =
  "font-sans text-[12px] text-[#0F172A] min-[861px]:text-[clamp(12px,0.9vw,16px)] max-[380px]:text-[11px]";

/* ---------- OTP ---------- */

export const otpInput =
  "w-full min-w-0 mt-[10px] h-12 p-0 text-center text-[18px] bg-white border border-[#dedee3] rounded-md " +
  "outline-none focus:border-[#8db7ef] " +
  "min-[861px]:h-[clamp(48px,3.6vw,64px)] min-[861px]:text-[clamp(18px,1.4vw,26px)]";

export const OTP_style_1 =
  "flex flex-wrap justify-between gap-2 mt-[50px] mb-[10px] text-[11px] text-[#888] " +
  "min-[861px]:text-[clamp(12px,0.9vw,16px)] max-[860px]:text-[12px]";

export const OTP_style_2 =
  "block mx-auto mt-[14px] border-0 bg-transparent text-[#999] text-[12px] cursor-pointer " +
  "min-[861px]:text-[clamp(12px,0.95vw,16px)]";

/* ---------- Page layout ---------- */

export const main_log_in =
  "grid min-h-dvh grid-cols-[minmax(0,52.2%)_minmax(0,47.8%)] " +
  "max-[1100px]:grid-cols-[minmax(0,40%)_minmax(0,60%)] " +
  "max-[860px]:grid-cols-[minmax(0,1fr)] max-[860px]:grid-rows-[auto_1fr]";

export const left_panel =
  `relative flex min-h-dvh items-center bg-black text-white pl-[9%] ${F_LIGHT} ` +
  "max-[1100px]:pl-[6%] " +
  "max-[860px]:min-h-0 max-[860px]:px-[8%] max-[860px]:py-[25px]";

export const logo_h1 =
  "flex items-center gap-[0.3em] text-[clamp(28px,2.5vw,56px)] font-light tracking-[0.01em] leading-[1.1] uppercase " +
  "min-[861px]:text-[clamp(28px,3vw,64px)] max-[860px]:text-[25px]";

export const logo_h2 =
  "block mt-[0.7em] text-[clamp(16px,1.65vw,34px)] font-[350] tracking-[0.04em] leading-[1.2] text-white " +
  "min-[861px]:text-[clamp(16px,2vw,40px)] max-[860px]:mt-3 max-[860px]:text-[18px]";

export const top_right_panel =
  "relative flex min-h-dvh min-w-0 items-center justify-center bg-[#f5f5f7] px-6 pt-[35px] pb-[55px] " +
  "max-[860px]:min-h-0 max-[860px]:p-0 max-[860px]:bg-white max-[860px]:items-stretch max-[860px]:justify-stretch";

export const right_sign_in_text = `${F_MED} text-[225%] leading-tight max-[860px]:text-[28px]`;

export const right_sign_in_below =
  `${F_LIGHT} text-[10px] text-[#0F172A] mt-[18px] mb-[38.5px] ` +
  "min-[861px]:text-[clamp(11px,0.9vw,15px)] " +
  "max-[860px]:text-[13px] max-[860px]:mb-6";

export const register_title =
  `${F_MED} text-[36px] text-[#333] mb-[34px] max-[860px]:text-[28px] max-[860px]:mb-[26px]`;

export const forgot_pass_word_style =
  "flex items-center gap-[10px] mt-[45px] mb-10 " +
  "mx-[calc(var(--pad-x,36px)_*_-0.9)] text-[10px] whitespace-nowrap " +
  "before:content-[''] before:h-px before:flex-1 before:bg-[#e7e7eb] " +
  "after:content-[''] after:h-px after:flex-1 after:bg-[#e7e7eb] " +
  "min-[861px]:text-[clamp(10px,0.9vw,14.5px)] " +
  "max-[860px]:mx-0 max-[860px]:mt-8 max-[860px]:mb-6 max-[860px]:text-[12px]";

export const social_btn_holder =
  "grid w-full justify-center gap-[14px] grid-cols-[repeat(3,minmax(0,150px))] " +
  "max-[860px]:grid-cols-[repeat(3,minmax(0,1fr))] max-[860px]:gap-[10px] max-[380px]:gap-[6px]";

export const seperator_other_ways =
  "grid justify-center text-center gap-[10px] mt-[50px] text-[12px] " +
  "min-[861px]:text-[clamp(10px,0.9vw,14.5px)] max-[860px]:text-[13px] max-[860px]:mt-8";
>>>>>>> 901b25f (update 2)
