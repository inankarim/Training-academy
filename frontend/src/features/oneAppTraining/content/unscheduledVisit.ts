import type { HotspotContent } from './types';

/**
 * Journey Cycle Plan → Task: Unscheduled Visit (SO only — TSMs don't have it).
 *
 * What the Teacher card says at each step of the task. Edit the text freely
 * in both languages; keep the step names on the left as they are.
 */
export type UnscheduledVisitStep =
  | 'list'
  | 'wrong_shop'
  | 'activity'
  | 'activity_later'
  | 'market'
  | 'market_submit_empty'
  | 'choose_brand'
  | 'fill_brand'
  | 'brand_missing'
  | 'rsp_not_higher'
  | 'brand_added'
  | 'market_submitted'
  | 'activity_later_sales'
  | 'sales_product'
  | 'sales_fill'
  | 'sales_unload'
  | 'sales_missing'
  | 'sales_discarded'
  | 'sales_submitted'
  | 'activity_later_branding'
  | 'branding_choose'
  | 'branding_none'
  | 'branding_done'
  | 'activity_later_picture'
  | 'picture_capture'
  | 'picture_missing'
  | 'picture_taken'
  | 'visit_done';

export const UNSCHEDULED_VISIT_GUIDE: Record<UnscheduledVisitStep, HotspotContent> = {
  list: {
    en: {
      title: 'Choose the shop',
      body: "Unscheduled Visit is for shops that aren't in today's plan. Select the ship to party you are visiting. For this task, tap ICHAPURI CEMENT HOUSE.",
    },
    bn: {
      title: 'দোকান বেছে নিন',
      body: 'আজকের প্ল্যানে নেই এমন দোকানের জন্য Unscheduled Visit। আপনি যে Ship to Party-তে ভিজিট করছেন সেটি বেছে নিন। এই টাস্কের জন্য ICHAPURI CEMENT HOUSE-এ ট্যাপ করুন।',
    },
  },
  wrong_shop: {
    en: {
      title: 'Choose the shop',
      body: 'For this task, tap ICHAPURI CEMENT HOUSE at the top of the list.',
    },
    bn: {
      title: 'দোকান বেছে নিন',
      body: 'এই টাস্কের জন্য তালিকার উপরের ICHAPURI CEMENT HOUSE-এ ট্যাপ করুন।',
    },
  },
  activity: {
    en: {
      title: 'Visit Activity',
      body: 'This is your visit to the shop. The Activity Checklist shows the 4 jobs to do here — each one says No Status until you finish it. Start with Collect Market Info.',
    },
    bn: {
      title: 'Visit Activity',
      body: 'এটি দোকানে আপনার ভিজিট। Activity Checklist-এ এখানে করার ৪টি কাজ দেখা যাচ্ছে—শেষ না করা পর্যন্ত প্রতিটিতে No Status লেখা থাকে। Collect Market Info দিয়ে শুরু করুন।',
    },
  },
  activity_later: {
    en: {
      title: 'One at a time',
      body: "You'll do this one later. For now, tap Collect Market Info.",
    },
    bn: {
      title: 'একটি একটি করে',
      body: 'এটি পরে করবেন। এখন Collect Market Info-তে ট্যাপ করুন।',
    },
  },
  market: {
    en: {
      title: 'Market Info',
      body: "Here you record how each cement brand is selling at this shop. Brand Wise Sales is empty until you add a brand. Tap Add Brand Info.",
    },
    bn: {
      title: 'Market Info',
      body: 'এখানে এই দোকানে কোন সিমেন্ট ব্র্যান্ড কেমন বিক্রি হচ্ছে তা লিখে রাখেন। ব্র্যান্ড যোগ না করা পর্যন্ত Brand Wise Sales খালি থাকে। Add Brand Info-তে ট্যাপ করুন।',
    },
  },
  market_submit_empty: {
    en: {
      title: 'Add a brand first',
      body: 'Market Info needs at least one brand. Tap Add Brand Info.',
    },
    bn: {
      title: 'আগে একটি ব্র্যান্ড যোগ করুন',
      body: 'Market Info-তে অন্তত একটি ব্র্যান্ড লাগবে। Add Brand Info-তে ট্যাপ করুন।',
    },
  },
  choose_brand: {
    en: {
      title: 'Step 1: Cement Brand',
      body: 'Tap Cement Brand and choose the brand you are surveying at this shop, then tap Ok.',
    },
    bn: {
      title: 'ধাপ ১: Cement Brand',
      body: 'Cement Brand-এ ট্যাপ করে এই দোকানে যে ব্র্যান্ডের সার্ভে করছেন সেটি বেছে নিন, তারপর Ok চাপুন।',
    },
  },
  fill_brand: {
    en: {
      title: 'Step 2: Survey the shop',
      body: "Ask the shop and fill in the real numbers for this brand:\n• Monthly Sales Volume — bags of this brand sold per month\n• WSP — wholesale price per bag\n• RSP — retail price per bag (always higher than WSP)\n• Stock — bags in the shop right now\n• Brand's Total Credit — credit this brand has given the shop, in Lac\n• Cash Offer — any cash offer running\n• Shop Branding — Yes if this brand's branding is at the shop, No if not\n\nThen tap Complete Adding Brand.",
    },
    bn: {
      title: 'ধাপ ২: দোকানে সার্ভে করুন',
      body: 'দোকানে জিজ্ঞেস করে এই ব্র্যান্ডের আসল তথ্য লিখুন:\n• Monthly Sales Volume — মাসে কত ব্যাগ বিক্রি হয়\n• WSP — প্রতি ব্যাগের পাইকারি (wholesale) দাম\n• RSP — প্রতি ব্যাগের খুচরা (retail) দাম (সবসময় WSP-এর চেয়ে বেশি)\n• Stock — এই মুহূর্তে দোকানে কত ব্যাগ আছে\n• Brand\'s Total Credit — এই ব্র্যান্ড দোকানকে কত টাকা (লাখে) বাকি দিয়েছে\n• Cash Offer — চলমান কোনো ক্যাশ অফার\n• Shop Branding — দোকানে এই ব্র্যান্ডের ব্র্যান্ডিং থাকলে Yes, না থাকলে No\n\nতারপর Complete Adding Brand-এ ট্যাপ করুন।',
    },
  },
  brand_missing: {
    en: {
      title: 'Some boxes are empty',
      body: 'Fill in every box marked in red with the numbers from the shop.',
    },
    bn: {
      title: 'কিছু ঘর খালি আছে',
      body: 'লাল দাগ দেওয়া প্রতিটি ঘর দোকান থেকে পাওয়া সংখ্যা দিয়ে পূরণ করুন।',
    },
  },
  rsp_not_higher: {
    en: {
      title: 'Check the prices',
      body: 'RSP must be higher than WSP. The shop buys at the wholesale price and sells to customers at the retail price, so the retail price is always more. Ask the shop again and enter the real prices — guessed numbers will not be accepted.',
    },
    bn: {
      title: 'দাম আবার দেখুন',
      body: 'RSP অবশ্যই WSP-এর চেয়ে বেশি হতে হবে। দোকান পাইকারি দামে কেনে আর খুচরা দামে কাস্টমারের কাছে বিক্রি করে, তাই খুচরা দাম সবসময় বেশি। দোকানে আবার জিজ্ঞেস করে আসল দাম লিখুন—আন্দাজে লেখা সংখ্যা গ্রহণ করা হবে না।',
    },
  },
  brand_added: {
    en: {
      title: 'Brand added!',
      body: 'The brand is now in Brand Wise Sales. If the shop sells other brands, add them too with Add Brand Info. When you are done, tap Submit Market Info.',
    },
    bn: {
      title: 'ব্র্যান্ড যোগ হয়েছে!',
      body: 'ব্র্যান্ডটি এখন Brand Wise Sales-এ দেখা যাচ্ছে। দোকানে অন্য ব্র্যান্ড বিক্রি হলে Add Brand Info দিয়ে সেগুলোও যোগ করুন। শেষ হলে Submit Market Info-তে ট্যাপ করুন।',
    },
  },
  market_submitted: {
    en: {
      title: 'Market Info done!',
      body: 'Market Info is submitted — the Activity Checklist now shows it as done. Next, tap Collect Sales Order to take an order from this shop.',
    },
    bn: {
      title: 'Market Info সম্পন্ন!',
      body: 'Market Info জমা হয়েছে—Activity Checklist-এ এখন এটি সম্পন্ন দেখাচ্ছে। এবার এই দোকান থেকে অর্ডার নিতে Collect Sales Order-এ ট্যাপ করুন।',
    },
  },
  activity_later_sales: {
    en: {
      title: 'One at a time',
      body: "You'll do this one later. For now, tap Collect Sales Order.",
    },
    bn: {
      title: 'একটি একটি করে',
      body: 'এটি পরে করবেন। এখন Collect Sales Order-এ ট্যাপ করুন।',
    },
  },
  sales_product: {
    en: {
      title: 'Step 1: Product',
      body: 'Tap Product and choose the cement product the shop wants to order, then tap Ok.',
    },
    bn: {
      title: 'ধাপ ১: Product',
      body: 'Product-এ ট্যাপ করে দোকান যে সিমেন্ট প্রোডাক্ট অর্ডার করতে চায় সেটি বেছে নিন, তারপর Ok চাপুন।',
    },
  },
  sales_fill: {
    en: {
      title: 'Step 2: Order and delivery',
      body: 'Fill in the order:\n• WSP Per Bags — the wholesale price per bag\n• Order quantity — how many bags the shop is ordering\nTotal Amount works itself out (WSP × quantity).\n\nThen the delivery:\n• Delivery Address — choose Retail shop address\n• Expected delivery date — when the shop needs it\n\nThen tap Submit Sales Order.',
    },
    bn: {
      title: 'ধাপ ২: অর্ডার ও ডেলিভারি',
      body: 'অর্ডারের তথ্য দিন:\n• WSP Per Bags — প্রতি ব্যাগের পাইকারি দাম\n• Order quantity — দোকান কত ব্যাগ অর্ডার করছে\nTotal Amount নিজে থেকেই হিসাব হয় (WSP × quantity)।\n\nতারপর ডেলিভারির তথ্য:\n• Delivery Address — Retail shop address বেছে নিন\n• Expected delivery date — দোকানের কবে লাগবে\n\nতারপর Submit Sales Order-এ ট্যাপ করুন।',
    },
  },
  sales_unload: {
    en: {
      title: 'Delivery Address',
      body: 'Unload site address is for delivering straight to a construction site. For this task, choose Retail shop address — the order goes to this shop.',
    },
    bn: {
      title: 'Delivery Address',
      body: 'সরাসরি নির্মাণ সাইটে ডেলিভারির জন্য Unload site address। এই টাস্কের জন্য Retail shop address বেছে নিন—অর্ডার এই দোকানেই যাবে।',
    },
  },
  sales_missing: {
    en: {
      title: 'Some boxes are empty',
      body: 'Fill in every box marked in red before you submit the sales order.',
    },
    bn: {
      title: 'কিছু ঘর খালি আছে',
      body: 'Sales Order জমা দেওয়ার আগে লাল দাগ দেওয়া প্রতিটি ঘর পূরণ করুন।',
    },
  },
  sales_discarded: {
    en: {
      title: 'Sales order discarded',
      body: 'Nothing was sent. Tap Collect Sales Order to try again.',
    },
    bn: {
      title: 'Sales Order বাতিল হয়েছে',
      body: 'কিছুই পাঠানো হয়নি। আবার চেষ্টা করতে Collect Sales Order-এ ট্যাপ করুন।',
    },
  },
  sales_submitted: {
    en: {
      title: 'Sales order submitted!',
      body: 'The Activity Checklist now shows Sales order as done. Next, tap Survey Shop Branding.',
    },
    bn: {
      title: 'Sales Order জমা হয়েছে!',
      body: 'Activity Checklist-এ এখন Sales order সম্পন্ন দেখাচ্ছে। এবার Survey Shop Branding-এ ট্যাপ করুন।',
    },
  },
  activity_later_branding: {
    en: {
      title: 'One at a time',
      body: "You'll do this one later. For now, tap Survey Shop Branding.",
    },
    bn: {
      title: 'একটি একটি করে',
      body: 'এটি পরে করবেন। এখন Survey Shop Branding-এ ট্যাপ করুন।',
    },
  },
  branding_choose: {
    en: {
      title: 'Survey Shop Branding',
      body: 'Look around the shop and tick every piece of our branding you can see — festoon, shop sign, sign board, shop paint and so on. Then tap Complete Shop Branding.',
    },
    bn: {
      title: 'Survey Shop Branding',
      body: 'দোকানের চারপাশ দেখে আমাদের যত ব্র্যান্ডিং চোখে পড়ে সবগুলোতে টিক দিন—Festoon, Shop Sign, Sign Board, Shop Paint ইত্যাদি। তারপর Complete Shop Branding-এ ট্যাপ করুন।',
    },
  },
  branding_none: {
    en: {
      title: 'Tick at least one',
      body: 'Choose at least one branding item you can see at the shop before you tap Complete Shop Branding.',
    },
    bn: {
      title: 'অন্তত একটিতে টিক দিন',
      body: 'Complete Shop Branding চাপার আগে দোকানে দেখা অন্তত একটি ব্র্যান্ডিং আইটেম বেছে নিন।',
    },
  },
  branding_done: {
    en: {
      title: 'Shop branding done!',
      body: 'The Activity Checklist now shows Shop branding as done. Last one: tap Take a Picture.',
    },
    bn: {
      title: 'Shop Branding সম্পন্ন!',
      body: 'Activity Checklist-এ এখন Shop branding সম্পন্ন দেখাচ্ছে। শেষ কাজ: Take a Picture-এ ট্যাপ করুন।',
    },
  },
  activity_later_picture: {
    en: {
      title: 'One at a time',
      body: 'For now, tap Take a Picture.',
    },
    bn: {
      title: 'একটি একটি করে',
      body: 'এখন Take a Picture-এ ট্যাপ করুন।',
    },
  },
  picture_capture: {
    en: {
      title: 'Take a Picture',
      body: 'In the real app you take a photo of the shop as proof that you visited — for example its front and our branding. Tap Capture a Picture.',
    },
    bn: {
      title: 'Take a Picture',
      body: 'আসল অ্যাপে ভিজিটের প্রমাণ হিসেবে দোকানের একটি ছবি তুলতে হয়—যেমন দোকানের সামনের দিক ও আমাদের ব্র্যান্ডিং। Capture a Picture-এ ট্যাপ করুন।',
    },
  },
  picture_missing: {
    en: {
      title: 'No picture yet',
      body: 'Tap Capture a Picture first, then Submit.',
    },
    bn: {
      title: 'এখনো ছবি তোলা হয়নি',
      body: 'আগে Capture a Picture-এ ট্যাপ করুন, তারপর Submit।',
    },
  },
  picture_taken: {
    en: {
      title: 'Picture captured',
      body: 'In the real app, check the photo is clear before you send it. Now tap Submit.',
    },
    bn: {
      title: 'ছবি তোলা হয়েছে',
      body: 'আসল অ্যাপে পাঠানোর আগে দেখে নিন ছবিটি স্পষ্ট কি না। এখন Submit-এ ট্যাপ করুন।',
    },
  },
  visit_done: {
    en: {
      title: 'Visit complete!',
      body: "All 4 activities are done — Market Info, Sales order, Shop branding and the picture. That's a finished unscheduled visit, and you've completed this task. Tap the back arrow to return to Journey Cycle Plan.",
    },
    bn: {
      title: 'ভিজিট সম্পন্ন!',
      body: '৪টি কাজই শেষ—Market Info, Sales order, Shop branding এবং ছবি। এভাবেই একটি Unscheduled Visit সম্পন্ন হয়, আর এই টাস্কটিও শেষ হয়েছে। Journey Cycle Plan-এ ফিরতে উপরের Back বাটনে ট্যাপ করুন।',
    },
  },
};
