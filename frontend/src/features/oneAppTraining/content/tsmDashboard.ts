import type { LessonContent } from './types';

/**
 * TSM Dashboard lesson — popup text for every tappable spot.
 *
 * Edit freely: titles, bodies, both languages. Keep the ids on the left
 * (profile_role, focus_area, …) exactly as they are — they must match
 * TSM_DASHBOARD in backend/src/modules/learner/hardcodedLessons.registry.ts.
 */
export const TSM_DASHBOARD_CONTENT: LessonContent = {
  profile_role: {
    en: {
      title: 'Your profile',
      body: 'Your name, role, and employee code, so you always know which account you are logged into.',
    },
    bn: {
      title: 'আপনার প্রোফাইল',
      body: 'আপনার নাম, Role এবং Employee Code—যাতে আপনি সবসময় বুঝতে পারেন কোন অ্যাকাউন্ট দিয়ে লগইন করেছেন।',
    },
  },

  focus_area: {
    en: {
      title: 'Focus Area',
      body: "The territory you manage — Region, Area, and Territory. Unlike an SO, there's no Sub Territory here: as a TSM you oversee the whole territory, not one slice of it.",
    },
    bn: {
      title: 'Focus Area',
      body: 'আপনি যে এলাকা পরিচালনা করেন—Region, Area এবং Territory। SO-এর মতো এখানে Sub Territory নেই: TSM হিসেবে আপনি পুরো Territory দেখাশোনা করেন, এর একটি অংশ নয়।',
    },
  },

  today_card: {
    en: {
      title: "Today's performance (your whole team)",
      body: "These numbers are your team's totals, not one person's. Today's Visits shows 30.23% — of your team's 43 scheduled visits today, 13 are complete, and 5 were unscheduled visits. Today's Orders (Ton) shows 30.11% — 53 tons were ordered from scheduled visits and 10 tons from unscheduled ones, against today's 175-ton target.",
    },
    bn: {
      title: 'আজকের পারফরম্যান্স (আপনার পুরো টিম)',
      body: "এই সংখ্যাগুলো আপনার পুরো টিমের মোট হিসাব, একজনের নয়। Today's Visits দেখাচ্ছে 30.23%—আজ টিমের 43টি নির্ধারিত ভিজিটের মধ্যে 13টি সম্পন্ন হয়েছে, আর 5টি ছিল আনশিডিউলড (unscheduled) ভিজিট। Today's Orders (Ton) দেখাচ্ছে 30.11%—নির্ধারিত ভিজিট থেকে 53 টন এবং আনশিডিউলড ভিজিট থেকে 10 টন অর্ডার এসেছে, আজকের 175 টন টার্গেটের বিপরীতে।",
    },
  },

  mtd_card: {
    en: {
      title: 'Month-to-date performance (your whole team)',
      body: 'MTD Visits at 45.37% means your team has made 318 visits against a month-to-date target of 701, out of 1,139 visits planned for the whole month. MTD Orders vs Delivery at 11.02% means 194 tons are done against 1,763 tons ordered, out of a 4,550-ton monthly target.',
    },
    bn: {
      title: 'চলতি মাসের পারফরম্যান্স (আপনার পুরো টিম)',
      body: 'MTD Visits 45.37% মানে আপনার টিম এ পর্যন্ত (MTD) 701টি টার্গেটের বিপরীতে 318টি ভিজিট করেছে; পুরো মাসের মোট ভিজিট টার্গেট 1,139টি। MTD Orders vs Delivery 11.02% মানে 1,763 টন অর্ডারের মধ্যে 194 টন সম্পন্ন হয়েছে, আর মাসিক টার্গেট 4,550 টন।',
    },
  },

  summary_tiles: {
    en: {
      title: 'Quick summary',
      body: "A fast snapshot of your team's performance: total orders, total order quantity, deliveries today, and new customers added.",
    },
    bn: {
      title: 'এক নজরে সারাংশ',
      body: 'আপনার টিমের পারফরম্যান্সের দ্রুত চিত্র: মোট অর্ডার, মোট অর্ডারের পরিমাণ, আজকের ডেলিভারি, এবং নতুন যোগ হওয়া কাস্টমার।',
    },
  },

  notifications_bell: {
    en: {
      title: 'Notifications',
      body: 'Tap here to see updates that need your attention, like approvals waiting on you or messages from your own manager.',
    },
    bn: {
      title: 'নোটিফিকেশন',
      body: 'এখানে ট্যাপ করে দেখুন কোন আপডেটগুলোতে আপনার মনোযোগ দরকার—যেমন আপনার অপেক্ষায় থাকা অ্যাপ্রুভাল বা আপনার নিজের ম্যানেজারের মেসেজ।',
    },
  },

  activity_section: {
    en: {
      title: 'Activity',
      body: "These are the sections you have in the One App:\n• Journey Cycle Plan\n• Business Development\n• SPO Management (only TSMs have this — it's where you manage your SPOs)\n• Customer Management\n• Manage Retail Order\n• Site/Project/Lead\n• Convert Project\n• MDM Approval\n• Expense\n• Performance Report\n\nYou'll learn each one in its own lesson.",
    },
    bn: {
      title: 'Activity সেকশন',
      body: 'One App-এ আপনার যে সেকশনগুলো আছে:\n• Journey Cycle Plan\n• Business Development\n• SPO Management (শুধু TSM-দের জন্য—এখানে আপনি আপনার SPO-দের পরিচালনা করেন)\n• Customer Management\n• Manage Retail Order\n• Site/Project/Lead\n• Convert Project\n• MDM Approval\n• Expense\n• Performance Report\n\nপ্রতিটি সেকশন আপনি আলাদা লেসনে শিখবেন।',
    },
  },
};
