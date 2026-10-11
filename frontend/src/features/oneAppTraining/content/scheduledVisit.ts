import type { HotspotContent } from './types';

/**
 * Journey Cycle Plan → Task: Scheduled Visit (SO only — TSMs don't have it).
 *
 * What the Teacher card says at each step of the task. Edit the text freely
 * in both languages; keep the step names on the left as they are.
 */
export type ScheduledVisitStep = 'list' | 'complete_tab' | 'too_far';

export const SCHEDULED_VISIT_GUIDE: Record<ScheduledVisitStep, HotspotContent> = {
  list: {
    en: {
      title: 'Your visits for today',
      body: "Target vs Actual shows how many of today's visits you've done and your sales order against today's target. Below are the shops you're scheduled to visit today. Tap a shop, or its Details, to start the visit.",
    },
    bn: {
      title: 'আজকের ভিজিট',
      body: 'Target vs Actual দেখায় আজকের কতগুলো ভিজিট আপনি করেছেন, আর আজকের টার্গেটের তুলনায় আপনার Sales Order কত। নিচে আজ যেসব দোকানে আপনার ভিজিট নির্ধারিত আছে সেগুলো দেখা যাচ্ছে। ভিজিট শুরু করতে কোনো দোকানে বা তার Details-এ ট্যাপ করুন।',
    },
  },
  complete_tab: {
    en: {
      title: 'Complete List',
      body: "Complete List shows the visits you've already finished today. Go back to Visit List and tap a shop.",
    },
    bn: {
      title: 'Complete List',
      body: 'Complete List-এ আজ যেসব ভিজিট শেষ করেছেন সেগুলো দেখা যায়। Visit List-এ ফিরে গিয়ে কোনো দোকানে ট্যাপ করুন।',
    },
  },
  too_far: {
    en: {
      title: 'You must be at the shop',
      body: "A scheduled visit only starts when you're within 100 meters of the shop — the app checks your phone's location. That's why you see \"You are not within the 100 meter radius.\" When you're at the shop, tapping it starts the visit.\n\nTap the back arrow to return to Journey Cycle Plan.",
    },
    bn: {
      title: 'দোকানে থাকতে হবে',
      body: 'দোকানের ১০০ মিটারের মধ্যে থাকলেই কেবল Scheduled Visit শুরু হয়—অ্যাপ আপনার ফোনের লোকেশন যাচাই করে। তাই "You are not within the 100 meter radius." দেখা যাচ্ছে। দোকানে পৌঁছে ট্যাপ করলে ভিজিট শুরু হবে।\n\nJourney Cycle Plan-এ ফিরতে উপরের Back (<) বাটনে ট্যাপ করুন।',
    },
  },
};
