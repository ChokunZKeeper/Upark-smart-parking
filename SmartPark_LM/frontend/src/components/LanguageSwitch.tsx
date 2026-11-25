import { Globe } from 'lucide-react'
import { useI18n } from '@/i18n'

/** ปุ่มเปลี่ยนภาษา EN <-> TH (ใช้ร่วมกันหน้า Home และ Sign in) */
export default function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'th' ? 'en' : 'th'

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      title={t('common.switchLanguage')}
      aria-label={t('common.switchLanguage')}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-sm text-inherit transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a72d9] ${className}`}
    >
      <Globe size={18} />
      <span className="uppercase">{lang}</span>
    </button>
  )
}
