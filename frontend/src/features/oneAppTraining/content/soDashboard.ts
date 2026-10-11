import type { LessonContent } from './types';

/**
 * SO / SPO Dashboard lesson — popup text for every tappable spot.
 *
 * Edit freely: titles, bodies, both languages. Keep the ids on the left
 * (profile_role, focus_area, …) exactly as they are — they must match
 * SO_DASHBOARD in backend/src/modules/learner/hardcodedLessons.registry.ts.
 */
export const SO_DASHBOARD_CONTENT: LessonContent = {
  profile_role: {
    en: {
      title: 'Your profile',
      body: 'Your name and role, so you always know which account you are logged into.',
    },
    bn: {
      title: 'আপনার প্রোফাইল',
      body: 'আপনার নাম এবং Role—যাতে আপনি সবসময় বুঝতে পারেন কোন অ্যাকাউন্ট দিয়ে লগইন করেছেন।',
    },
  },

  focus_area: {
    en: {
      title: 'Focus Area',
      body: 'Your assigned territory, from Region down to Sub Territory — this is the area your numbers below are tracking.',
    },
    bn: {
      title: 'Focus Area',
      body: 'আপনাকে দেওয়া এলাকা—Region থেকে Sub Territory পর্যন্ত। নিচের সব সংখ্যা এই এলাকারই হিসাব দেখায়।',
    },
  },

  today_card: {
    en: {
      title: "Today's performance",
      body: "Today's Visits is the percentage of your scheduled visits you've completed so far today — the bar fills as you check in. Today's Orders works the same way for the orders you've taken today against what was expected of you.",
    },
    bn: {
      title: 'আজকের পারফরম্যান্স',
      body: "Today's Visits দেখায় আজকের নির্ধারিত (scheduled) ভিজিটের কত শতাংশ আপনি এখন পর্যন্ত সম্পন্ন করেছেন—চেক-ইন করলে বারটি পূর্ণ হতে থাকে। Today's Orders একইভাবে দেখায় আজ আপনি কত অর্ডার নিয়েছেন, আপনার কাছে যা প্রত্যাশিত ছিল তার তুলনায়।",
    },
  },

  mtd_card: {
    en: {
      title: 'Month-to-date performance',
      body: "MTD Visits is your visit completion rate for the whole month so far, out of this month's full visit target. MTD Orders vs Delivery compares what you've ordered against your monthly target, and how much of that has actually been delivered.",
    },
    bn: {
      title: 'চলতি মাসের পারফরম্যান্স (MTD)',
      body: 'MTD Visits দেখায় এই মাসে এখন পর্যন্ত আপনার ভিজিট সম্পন্নের হার, পুরো মাসের ভিজিট টার্গেটের তুলনায়। MTD Orders vs Delivery আপনার অর্ডারকে মাসিক টার্গেটের সাথে তুলনা করে, এবং তার কতটুকু আসলে ডেলিভারি হয়েছে তা দেখায়।',
    },
  },

  summary_tiles: {
    en: {
      title: 'Quick summary',
      body: 'A fast snapshot: total orders, total order quantity, deliveries today, and new customers you have added.',
    },
    bn: {
      title: 'এক নজরে সারাংশ',
      body: 'দ্রুত একটি চিত্র: মোট অর্ডার, মোট অর্ডারের পরিমাণ, আজকের ডেলিভারি, এবং আপনি নতুন যত কাস্টমার যোগ করেছেন।',
    },
  },

  notifications_bell: {
    en: {
      title: 'Notifications',
      body: 'Tap here to see updates that need your attention, like order approvals or messages from your manager.',
    },
    bn: {
      title: 'নোটিফিকেশন',
      body: 'এখানে ট্যাপ করে দেখুন কোন আপডেটগুলোতে আপনার মনোযোগ দরকার—যেমন অর্ডার অ্যাপ্রুভাল বা আপনার ম্যানেজারের মেসেজ।',
    },
  },

  activity_section: {
    en: {
      title: 'Activity',
      body: "These are the sections you have in the One App:\n• Journey Cycle Plan\n• Business Development\n• Order Management\n• Customer Management\n• Site/Project/Lead\n• Expense\n• Performance Report\n\nYou'll learn each one in its own lesson.",
    },
    bn: {
      title: 'Activity সেকশন',
      body: 'One App-এ আপনার যে সেকশনগুলো আছে:\n• Journey Cycle Plan\n• Business Development\n• Order Management\n• Customer Management\n• Site/Project/Lead\n• Expense\n• Performance Report\n\nপ্রতিটি সেকশন আপনি আলাদা লেসনে শিখবেন।',
    },
  },
};
