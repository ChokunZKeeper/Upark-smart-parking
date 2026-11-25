import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'th'
type Dict = Record<string, unknown>

// รวมไฟล์ JSON ทุกไฟล์ใน src/locales/<lang>/<namespace>.json อัตโนมัติ
// key ที่ใช้เรียก = "<namespace>.<path.in.json>" เช่น t('sidebar.dashboard')
const modules = import.meta.glob('../locales/*/*.json', { eager: true, import: 'default' }) as Record<string, Dict>

const dictionaries: Record<Lang, Dict> = { en: {}, th: {} }
for (const [path, content] of Object.entries(modules)) {
  const m = path.match(/locales\/(en|th)\/(.+)\.json$/)
  if (m) (dictionaries[m[1] as Lang] as Dict)[m[2]] = content
}

const STORAGE_KEY = 'language'

function lookup(dict: Dict, key: string): string | undefined {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Dict)) cur = (cur as Dict)[part]
    else return undefined
  }
  return typeof cur === 'string' ? cur : undefined
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: TFunction
}

const I18nContext = createContext<I18nValue | null>(null)

function readInitialLang(): Lang {
  return localStorage.getItem(STORAGE_KEY) === 'th' ? 'th' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback<TFunction>(
    (key, vars) => {
      // ถ้าไม่พบในภาษาปัจจุบัน ให้ fallback เป็นอังกฤษ แล้วเป็นตัว key
      const text = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key
      return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : text
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

// ใช้ใน component: const t = useT();  t('settings.title')  /  t('x.greeting', { name })
export const useT = () => useI18n().t
