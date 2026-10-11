import type { HotspotContent } from './types';

/**
 * Journey Cycle Plan → Task: Visit/Leave Request (same for SO and TSM).
 *
 * What the Teacher card says at each step of the task. Edit the text freely
 * in both languages; keep the step names on the left as they are.
 */
export type VisitLeaveStep =
  | 'list'
  | 'choose_type'
  | 'chose_leave'
  | 'choose_duration'
  | 'chose_multiple'
  | 'fill_details'
  | 'missing_details'
  | 'preview'
  | 'cancelled'
  | 'done';

export const VISIT_LEAVE_REQUEST_GUIDE: Record<VisitLeaveStep, HotspotContent> = {
  list: {
    en: {
      title: 'Your requests',
      body: 'This screen lists the visit and leave requests you have made, with their status. To make a new one, tap the Request button at the bottom.',
    },
    bn: {
      title: 'আপনার অনুরোধগুলো',
      body: 'এই স্ক্রিনে আপনার করা সব Visit ও Leave Request এবং সেগুলোর Status দেখা যায়। নতুন অনুরোধ করতে নিচের Request বাটনে ট্যাপ করুন।',
    },
  },
  choose_type: {
    en: {
      title: 'Step 1: Request type',
      body: 'Tap Request type and choose Visit request.',
    },
    bn: {
      title: 'ধাপ ১: Request type',
      body: 'Request type-এ ট্যাপ করে Visit request বেছে নিন।',
    },
  },
  chose_leave: {
    en: {
      title: 'Leave request',
      body: 'You use Leave request to ask for time off — it works the same way. For this task, choose Visit request.',
    },
    bn: {
      title: 'Leave request',
      body: 'ছুটি (leave) চাইতে Leave request ব্যবহার করা হয়—এটিও একইভাবে কাজ করে। এই টাস্কের জন্য Visit request বেছে নিন।',
    },
  },
  choose_duration: {
    en: {
      title: 'Step 2: Duration of visit',
      body: 'Tap Duration of visit and choose Single day.',
    },
    bn: {
      title: 'ধাপ ২: Duration of visit',
      body: 'Duration of visit-এ ট্যাপ করে Single day বেছে নিন।',
    },
  },
  chose_multiple: {
    en: {
      title: 'Multiple days',
      body: 'Choose Multiple days when one visit lasts more than a day. For this task, choose Single day.',
    },
    bn: {
      title: 'Multiple days',
      body: 'একটি ভিজিট এক দিনের বেশি হলে Multiple days বেছে নিন। এই টাস্কের জন্য Single day বেছে নিন।',
    },
  },
  fill_details: {
    en: {
      title: 'Step 3: Visit information',
      body: 'Fill in the date of the visit, the company name, its address, and the purpose of the visit. Then tap Preview Request Creation.',
    },
    bn: {
      title: 'ধাপ ৩: Visit Information',
      body: 'ভিজিটের তারিখ, কোম্পানির নাম, ঠিকানা এবং ভিজিটের উদ্দেশ্য লিখুন। তারপর Preview Request Creation-এ ট্যাপ করুন।',
    },
  },
  missing_details: {
    en: {
      title: 'Some details are missing',
      body: 'Fill in every box under Visit Information before you preview the request.',
    },
    bn: {
      title: 'কিছু তথ্য বাকি আছে',
      body: 'Preview করার আগে Visit Information-এর সব ঘর পূরণ করুন।',
    },
  },
  preview: {
    en: {
      title: 'Step 4: Check and send',
      body: 'Check every detail. If something is wrong, tap Cancel Request. If it is all correct, tap Complete Request Creation to send it.',
    },
    bn: {
      title: 'ধাপ ৪: যাচাই করে পাঠান',
      body: 'সব তথ্য ভালো করে দেখুন। কিছু ভুল থাকলে Cancel Request-এ ট্যাপ করুন। সব ঠিক থাকলে পাঠাতে Complete Request Creation-এ ট্যাপ করুন।',
    },
  },
  cancelled: {
    en: {
      title: 'Request cancelled',
      body: 'Nothing was sent. Tap the Request button to try again.',
    },
    bn: {
      title: 'অনুরোধ বাতিল হয়েছে',
      body: 'কিছুই পাঠানো হয়নি। আবার চেষ্টা করতে Request বাটনে ট্যাপ করুন।',
    },
  },
  done: {
    en: {
      title: 'Request sent!',
      body: 'Your visit request is now at the top of the list as Pending. It stays Pending until it is approved. Tap the back arrow to return to Journey Cycle Plan.',
    },
    bn: {
      title: 'অনুরোধ পাঠানো হয়েছে!',
      body: 'আপনার Visit Request এখন তালিকার উপরে Pending হিসেবে দেখা যাচ্ছে। Approve না হওয়া পর্যন্ত এটি Pending থাকবে। Journey Cycle Plan-এ ফিরতে উপরের Back (<) বাটনে ট্যাপ করুন।',
    },
  },
};
