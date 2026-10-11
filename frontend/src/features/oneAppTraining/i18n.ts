import { createContext, useContext } from 'react';

export type LessonLang = 'en' | 'bn';

export const LessonLangContext = createContext<LessonLang>('en');
export const useLessonLang = () => useContext(LessonLangContext);

const STORAGE_KEY = 'oneAppLessonLang';

export function loadLessonLang(): LessonLang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function saveLessonLang(lang: LessonLang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode / blocked storage — the choice just won't persist.
  }
}

/** Page and Teacher-card text. Terms the One App itself shows in English stay in English in Bangla too. */
export const UI_TEXT = {
  en: {
    backToCourse: 'Back to course',
    pageHint: 'Tap anything on the phone screen to learn what it does.',
    yourTeacher: 'Your Teacher',
    hello: (name: string) => `Hello ${name}!`,
    levelTag: 'Level 1 · Click & Learn',
    tapTitle: 'Tap around to learn!',
    tapBody: 'Tap any button, number, or card on the phone. I will pop up and explain what it does in simple words.',
    doneTitle: 'Nicely done!',
    doneBody: "You've explored everything on this screen. Continue to the next step, or start over to go through it again.",
    explored: "You've explored",
    things: (n: number, total: number) => `${n}/${total} things`,
    tasksDone: 'Tasks completed',
    tasks: (n: number, total: number) => `${n}/${total} tasks`,
    continue: 'Continue',
    startOver: 'Start over from the beginning',
  },
  bn: {
    backToCourse: 'কোর্সে ফিরে যান',
    pageHint: 'ফোনের স্ক্রিনে যেকোনো কিছুতে ট্যাপ করে জানুন সেটি কী কাজ করে।',
    yourTeacher: 'আপনার শিক্ষক',
    hello: (name: string) => `হ্যালো ${name}!`,
    levelTag: 'লেভেল ১ · ক্লিক করে শিখুন',
    tapTitle: 'ট্যাপ করে শিখুন!',
    tapBody: 'ফোনের যেকোনো বাটন, সংখ্যা বা কার্ডে ট্যাপ করুন। আমি সহজ ভাষায় বুঝিয়ে দেব এটি কী কাজ করে।',
    doneTitle: 'দারুণ হয়েছে!',
    doneBody: 'এই স্ক্রিনের সবকিছু আপনি দেখে ফেলেছেন। পরের ধাপে এগিয়ে যান, অথবা আবার দেখতে শুরু থেকে শুরু করুন।',
    explored: 'আপনি দেখেছেন',
    things: (n: number, total: number) => `${total}টির মধ্যে ${n}টি`,
    tasksDone: 'সম্পন্ন টাস্ক',
    tasks: (n: number, total: number) => `${total}টির মধ্যে ${n}টি টাস্ক`,
    continue: 'এগিয়ে যান',
    startOver: 'শুরু থেকে আবার শুরু করুন',
  },
} as const;
