/**
 * The source of truth for which hotspots exist on each hardcoded lesson
 * (an interactive replica of a real app screen). Mirrored on the frontend
 * by a component of the same key — the backend never trusts a client's
 * claimed hotspot count, only ids it recognizes here.
 *
 * Adding a new hardcoded lesson later = one new entry here (its hotspot
 * ids) + one new frontend component with the same key. No migration, no
 * other code change.
 */
export const HARDCODED_LESSON_HOTSPOTS: Record<string, string[]> = {
  SO_DASHBOARD: [
    'profile_role',
    'focus_area',
    'today_card',
    'mtd_card',
    'summary_tiles',
    'notifications_bell',
    'activity_section',
  ],
  TSM_DASHBOARD: [
    'profile_role',
    'focus_area',
    'today_card',
    'mtd_card',
    'summary_tiles',
    'notifications_bell',
    'activity_section',
  ],
  SO_JOURNEY_CYCLE_PLAN: ['scheduled_visit', 'unscheduled_visit', 'visit_leave_request', 'check_in_out'],
  TSM_JOURNEY_CYCLE_PLAN: ['visit_leave_request', 'manage_requests', 'check_in_out', 'check_in_out_report'],
};

export function getHotspotIds(hardcodedKey: string): string[] {
  return HARDCODED_LESSON_HOTSPOTS[hardcodedKey] ?? [];
}
