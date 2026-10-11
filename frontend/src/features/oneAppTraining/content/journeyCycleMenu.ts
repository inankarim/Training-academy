import type { HotspotContent } from './types';

/**
 * Journey Cycle Plan menu — what the Teacher card says while tasks are done
 * in order (SO and TSM). `task` is the row title, e.g. "Visit/Leave Request".
 * Edit the wording freely in both languages.
 */
export function journeyMenuGuide(step: number, total: number, task: string): HotspotContent {
  return {
    en: {
      title: `Task ${step} of ${total}: ${task}`,
      body: `This is where you plan and track your visits. Do the tasks in order — tap the highlighted row, ${task}. Each finished task gets a green border.`,
    },
    bn: {
      title: `টাস্ক ${step}/${total}: ${task}`,
      body: `এখান থেকে আপনি ভিজিট প্ল্যান ও ট্র্যাক করেন। টাস্কগুলো ক্রমানুসারে করুন—হাইলাইট করা ${task}-এ ট্যাপ করুন। প্রতিটি শেষ হওয়া টাস্কের চারপাশে সবুজ বর্ডার দেখা যাবে।`,
    },
  };
}

/** Shown when the learner taps a row that isn't their turn yet. */
export function journeyLockedGuide(task: string): HotspotContent {
  return {
    en: {
      title: 'One task at a time',
      body: `That task isn't open yet. Finish ${task} first — it's the highlighted row.`,
    },
    bn: {
      title: 'একটি একটি করে টাস্ক',
      body: `এই টাস্কটি এখনো খোলা হয়নি। আগে ${task} শেষ করুন—হাইলাইট করা সারিটি।`,
    },
  };
}
