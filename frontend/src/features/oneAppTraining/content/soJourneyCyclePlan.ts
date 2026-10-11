import type { LessonContent } from './types';

/**
 * SO / SPO Journey Cycle Plan lesson — popup text for every tappable spot.
 *
 * Edit freely: titles, bodies, both languages. Keep the ids on the left
 * exactly as they are — they must match SO_JOURNEY_CYCLE_PLAN in
 * backend/src/modules/learner/hardcodedLessons.registry.ts.
 */
export const SO_JOURNEY_CYCLE_PLAN_CONTENT: LessonContent = {
  visit_leave_request: {
    en: {
      title: 'Visit/Leave Request',
      body: 'Request leave for yourself, or request a customer visit, from here.',
    },
    bn: {
      title: 'Visit/Leave Request',
      body: 'এখান থেকে নিজের ছুটির (leave) আবেদন করুন, অথবা কাস্টমার ভিজিটের অনুরোধ করুন।',
    },
  },

  check_in_out: {
    en: {
      title: 'Check In / Out',
      body: 'Record your check in and check out here.',
    },
    bn: {
      title: 'Check In / Out',
      body: 'এখানে আপনার Check In এবং Check Out রেকর্ড করুন।',
    },
  },

  unscheduled_visit: {
    en: {
      title: 'Unscheduled Visit',
      body: "Your adhoc Journey Cycle Plans — use this when you visit a customer who wasn't in your plan.",
    },
    bn: {
      title: 'Unscheduled Visit',
      body: 'আপনার অ্যাডহক (adhoc) Journey Cycle Plan—প্ল্যানে না থাকা কোনো কাস্টমারকে ভিজিট করলে এটি ব্যবহার করুন।',
    },
  },

  scheduled_visit: {
    en: {
      title: 'Scheduled Visit',
      body: 'The list of your scheduled Journey Cycle Plans — the customer visits planned for you.',
    },
    bn: {
      title: 'Scheduled Visit',
      body: 'আপনার নির্ধারিত (scheduled) Journey Cycle Plan-এর তালিকা—আপনার জন্য প্ল্যান করা কাস্টমার ভিজিটগুলো।',
    },
  },
};
