import type { LessonContent } from './types';

/**
 * TSM Journey Cycle Plan lesson — popup text for every tappable spot.
 *
 * Edit freely: titles, bodies, both languages. Keep the ids on the left
 * exactly as they are — they must match TSM_JOURNEY_CYCLE_PLAN in
 * backend/src/modules/learner/hardcodedLessons.registry.ts.
 */
export const TSM_JOURNEY_CYCLE_PLAN_CONTENT: LessonContent = {
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

  manage_requests: {
    en: {
      title: 'Manage Requests',
      body: 'Approve or reject the visit and leave requests that are sent to you.',
    },
    bn: {
      title: 'Manage Requests',
      body: 'আপনার কাছে আসা ভিজিট ও ছুটির (leave) অনুরোধগুলো এখান থেকে Approve বা Reject করুন।',
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

  check_in_out_report: {
    en: {
      title: 'Check In / Out Report',
      body: 'See the report of employee check ins and check outs.',
    },
    bn: {
      title: 'Check In / Out Report',
      body: 'এখানে কর্মীদের Check In ও Check Out-এর রিপোর্ট দেখুন।',
    },
  },
};
