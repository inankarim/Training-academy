import type { LessonLang } from '../i18n';

// One file per One App lesson lives in this folder (soDashboard.ts, tsmDashboard.ts, …).
// To add a lesson, e.g. Journey Cycle Plan: copy tsmDashboard.ts, write its text, import
// it in that lesson's screen component, and list its hotspot ids in
// backend/src/modules/learner/hardcodedLessons.registry.ts.

export interface HotspotText {
  title: string;
  /** Use \n for a new line and "• " for a bullet point. */
  body: string;
}

/** One hotspot's popup, in every language. */
export type HotspotContent = Record<LessonLang, HotspotText>;

/** All popups for one lesson screen, keyed by hotspot id. */
export type LessonContent = Record<string, HotspotContent>;
