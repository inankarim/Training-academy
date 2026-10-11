import React from 'react';
import { History, CopyCheck, UserCheck, ClipboardCheck } from 'lucide-react';
import { TSM_JOURNEY_CYCLE_PLAN_CONTENT } from '../content/tsmJourneyCyclePlan';
import { JourneyCyclePlanApp, type JourneyRow, type JourneyScreenProps } from './journeyCycle/JourneyCyclePlanApp';

const ROWS: JourneyRow[] = [
  { id: 'visit_leave_request', icon: History, title: 'Visit/Leave Request', subtitle: 'Request for leave or customer visit' },
  { id: 'manage_requests', icon: CopyCheck, title: 'Manage Requests', subtitle: 'Approve or reject any visit/leave request' },
  { id: 'check_in_out', icon: UserCheck, title: 'Check In / Out', subtitle: 'Employee check in/out' },
  { id: 'check_in_out_report', icon: ClipboardCheck, title: 'Check In / Out Report', subtitle: 'Employee check in/out report' },
];

/** The order the learner must complete the tasks in. */
const TASK_ORDER = ['visit_leave_request', 'manage_requests', 'check_in_out', 'check_in_out_report'];

/** Journey Cycle Plan as a TSM sees it — opened from the Activity section of the Dashboard. */
export const TSMJourneyCyclePlanScreen: React.FC<JourneyScreenProps> = (props) => (
  <JourneyCyclePlanApp rows={ROWS} content={TSM_JOURNEY_CYCLE_PLAN_CONTENT} taskOrder={TASK_ORDER} {...props} />
);
