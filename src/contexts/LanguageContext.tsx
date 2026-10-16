import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Lang = "kk" | "ru";

interface Translations {
  [key: string]: string;
}

const kk: Translations = {
  // Nav
  "nav.help": "Көмек",
  "nav.history": "Тарих",
  "nav.medicine": "Дәрі",
  "nav.profile": "Профиль",
  "nav.pro": "Pro",
  "nav.admin": "Админ",
  "nav.menu": "Мәзір",
  "nav.logout": "Шығу",
  "nav.subtitle.pro": "Pro медициналық көмекші — лимитсіз",
  "nav.subtitle.free": "Қарапайым медициналық көмекші",

  // Chat
  "chat.placeholder": "Сұрағыңызды жазыңыз...",
  "chat.send": "Жіберу",
  "chat.remaining": "Қалған сұрақ",
  "chat.unlimited": "Шексіз",
  "chat.mode.medical": "Медицина",
  "chat.mode.psychology": "Психология",
  "chat.mode.motivation": "Мотивация",
  "chat.mode.nutrition": "Тамақ",
  "chat.mode.fitness": "Фитнес",
  "chat.welcome": "AIZHAN-ға қош келдіңіз! Денсаулық, психология, тамақтану немесе фитнес бойынша сұрақ қойыңыз.",
  "chat.limit.title": "Сұрақ лимиті бітті",
  "chat.limit.desc": "12 сағатта 5 тегін сұрақ. Pro жазылым арқылы лимитсіз қолданыңыз.",
  "chat.limit.buy": "Pro алу",

  // Pro page
  "pro.badge": "AIZHAN Pro",
  "pro.title": "Лимитсіз және толық жауап беретін Pro режим",
  "pro.desc": "Pro жазылымы AI-ды күнделікті көмекші ретінде жиі қолданатын адамдарға арналған.",
  "pro.price": "4990 тг / ай",
  "pro.active": "Pro белсенді",
  "pro.until": "дейін",
  "pro.unlimited": "мерзімсіз",
  "pro.buy": "WhatsApp арқылы Pro алу",
  "pro.go_chat": "Чатқа өту",
  "pro.price_label": "Бағасы",
  "pro.per_month": "/ ай",
  "pro.benefit1.title": "Лимитсіз сұрақ",
  "pro.benefit1.text": "Pro қолданушылар қанша сұрақ қойса да болады. Free жоспарында 12 сағатқа 5 сұрақ беріледі.",
  "pro.benefit2.title": "Толығырақ жауап",
  "pro.benefit2.text": "Pro режимінде AI жауапты кеңірек түсіндіреді: себептер, қадамдар, қауіп белгілері және келесі әрекеттер.",
  "pro.benefit3.title": "Күштірек AI режимі",
  "pro.benefit3.text": "Free жауап қысқа және жалпы бағыт береді, ал Pro жауабы тереңірек әрі практикалық болады.",
  "pro.benefit4.title": "Қауіпсіз кеңес",
  "pro.benefit4.text": "Медициналық сұрақтарда AI диагноз қоймайды, бірақ маңызды жағдайда дәрігерге қаралуды ескертеді.",
  "pro.diff.title": "Free пен Pro айырмашылығы",
  "pro.diff.text": "Free жоспарында AI қысқа, негізгі бағыттағы жауап береді және 12 сағатқа 5 сұрақпен шектеледі. Pro жоспарында сұрақ саны шектелмейді, жауаптар толық, нақтырақ және қолдануға ыңғайлы құрылыммен беріледі.",
  "pro.check1": "Лимитсіз AI сұрақ",
  "pro.check2": "Толық әрі терең жауап",
  "pro.check3": "Медициналық қауіпсіздік ескертулері",
  "pro.whatsapp_btn": "WhatsApp жіберу",

  // Welcome 3-day Pro gift
  "welcome.badge": "СЫЙЛЫҚ • PRO",
  "welcome.title": "Сізге 3 күн тегін PRO сыйладық!",
  "welcome.subtitle": "AIZHAN-ға тіркелгеніңіз үшін рахмет 💛",
  "welcome.desc": "Тіркелген сәттен бастап 3 күн бойы AIZHAN-ның барлық PRO мүмкіндіктері сізге толықтай ашық. Ешқандай төлем жасамайсыз.",
  "welcome.bullet1": "Лимитсіз AI сұрақтар (free режимінде 12 сағатқа 5 ғана)",
  "welcome.bullet2": "Толық және терең медициналық жауаптар",
  "welcome.bullet3": "Барлық режимдер: медицина, психология, тамақтану, фитнес",
  "welcome.until": "PRO белсенді",
  "welcome.cta": "Тамаша, бастаймын!",

  // PRO expired
  "expired.title": "3 күндік PRO кезеңі аяқталды",
  "expired.subtitle": "Сіз қайта Free режиміне көштіңіз",
  "expired.desc": "Сыйлық ретінде берілген 3 күндік PRO мерзімі аяқталды. Енді 12 сағатта 5 тегін сұраққа қайта оралдыңыз. PRO-ны жалғастырып, лимитсіз сұрақ қойғыңыз келсе, төмендегі түймені басыңыз.",
  "expired.cta": "PRO-ны жалғастыру",
  "expired.later": "Кейінірек",

  // Language select dialog
  "langselect.title": "Тілді таңдаңыз",
  "langselect.subtitle": "Сайтты қай тілде жалғастырғыңыз келеді?",
  "langselect.kk": "Қазақша",
  "langselect.ru": "Орысша",
  "langselect.continue": "Жалғастыру",

  // Medicine
  "medicine.searching": "Іздеу жүріп жатыр...",
};

const ru: Translations = {
  // Nav
  "nav.help": "Помощь",
  "nav.history": "История",
  "nav.medicine": "Лекарства",
  "nav.profile": "Профиль",
  "nav.pro": "Pro",
  "nav.admin": "Админ",
  "nav.menu": "Меню",
  "nav.logout": "Выйти",
  "nav.subtitle.pro": "Pro медицинский ассистент — без лимита",
  "nav.subtitle.free": "Простой медицинский ассистент",

  // Chat
  "chat.placeholder": "Напишите ваш вопрос...",
  "chat.send": "Отправить",
  "chat.remaining": "Осталось вопросов",
  "chat.unlimited": "Без ограничений",
  "chat.mode.medical": "Медицина",
  "chat.mode.psychology": "Психология",
  "chat.mode.motivation": "Мотивация",
  "chat.mode.nutrition": "Питание",
  "chat.mode.fitness": "Фитнес",
  "chat.welcome": "Добро пожаловать в AIZHAN! Задайте вопрос о здоровье, психологии, питании или фитнесе.",
  "chat.limit.title": "Лимит вопросов исчерпан",
  "chat.limit.desc": "5 бесплатных вопросов на 12 часов. Подключите Pro для безлимитного доступа.",
  "chat.limit.buy": "Получить Pro",

  // Pro page
  "pro.badge": "AIZHAN Pro",
  "pro.title": "Безлимитный Pro-режим с подробными ответами",
  "pro.desc": "Pro-подписка создана для тех, кто использует AI как ежедневного помощника.",
  "pro.price": "4990 тг / мес",
  "pro.active": "Pro активен",
  "pro.until": "до",
  "pro.unlimited": "бессрочно",
  "pro.buy": "Получить Pro через WhatsApp",
  "pro.go_chat": "Перейти в чат",
  "pro.price_label": "Цена",
  "pro.per_month": "/ мес",
  "pro.benefit1.title": "Безлимитные вопросы",
  "pro.benefit1.text": "Pro-пользователи могут задавать любое количество вопросов. В Free — 5 вопросов на 12 часов.",
  "pro.benefit2.title": "Подробные ответы",
  "pro.benefit2.text": "В Pro-режиме AI даёт более глубокие объяснения: причины, шаги, признаки опасности и следующие действия.",
  "pro.benefit3.title": "Усиленный AI-режим",
  "pro.benefit3.text": "Free даёт короткие и общие ответы, Pro — более глубокие и практичные.",
  "pro.benefit4.title": "Безопасные советы",
  "pro.benefit4.text": "В медицинских вопросах AI не ставит диагноз, но предупреждает о необходимости обратиться к врачу.",
  "pro.diff.title": "Разница между Free и Pro",
  "pro.diff.text": "В Free AI даёт короткие, общие ответы с лимитом 5 вопросов на 12 часов. В Pro нет лимита, а ответы полные, точные и хорошо структурированные.",
  "pro.check1": "Безлимит AI-вопросов",
  "pro.check2": "Полные и глубокие ответы",
  "pro.check3": "Медицинские предупреждения",
  "pro.whatsapp_btn": "Написать в WhatsApp",

  // Welcome 3-day Pro gift
  "welcome.badge": "ПОДАРОК • PRO",
  "welcome.title": "Вам подарено 3 дня PRO бесплатно!",
  "welcome.subtitle": "Спасибо за регистрацию в AIZHAN 💛",
  "welcome.desc": "С момента регистрации все возможности PRO открыты для вас на 3 дня. Никакой оплаты не требуется.",
  "welcome.bullet1": "Безлимитные AI-вопросы (Free — только 5 на 12ч)",
  "welcome.bullet2": "Полные и подробные медицинские ответы",
  "welcome.bullet3": "Все режимы: медицина, психология, питание, фитнес",
  "welcome.until": "PRO активен до",
  "welcome.cta": "Отлично, начинаю!",

  // PRO expired
  "expired.title": "3 дня PRO закончились",
  "expired.subtitle": "Вы вернулись в Free-режим",
  "expired.desc": "Подарочный 3-дневный PRO закончился. Теперь у вас снова 5 бесплатных вопросов на 12 часов. Чтобы продолжить с безлимитом, нажмите кнопку ниже.",
  "expired.cta": "Продолжить с PRO",
  "expired.later": "Позже",

  // Language select dialog
  "langselect.title": "Выберите язык",
  "langselect.subtitle": "На каком языке продолжить работу с сайтом?",
  "langselect.kk": "Казахский",
  "langselect.ru": "Русский",
  "langselect.continue": "Продолжить",

  // Medicine
  "medicine.searching": "Идёт поиск...",
};

const translations: Record<Lang, Translations> = { kk, ru };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  hasChosen: boolean;
  markChosen: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "kk",
  setLang: () => {},
  t: (key) => key,
  hasChosen: true,
  markChosen: () => {},
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("aizhan_lang");
    return (saved === "ru" ? "ru" : "kk") as Lang;
  });
  const [hasChosen, setHasChosen] = useState<boolean>(() => {
    return localStorage.getItem("aizhan_lang_chosen") === "1";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("aizhan_lang", l);
  };

  const markChosen = () => {
    localStorage.setItem("aizhan_lang_chosen", "1");
    setHasChosen(true);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.kk[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, hasChosen, markChosen }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
