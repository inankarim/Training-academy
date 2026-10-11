import React from 'react';
import { History, UserCheck, CalendarMinus, CalendarCheck } from 'lucide-react';
import { SO_JOURNEY_CYCLE_PLAN_CONTENT } from '../content/soJourneyCyclePlan';
import { JourneyCyclePlanApp, type JourneyRow, type JourneyScreenProps } from './journeyCycle/JourneyCyclePlanApp';

const ROWS: JourneyRow[] = [
  { id: 'scheduled_visit', icon: CalendarCheck, title: 'Scheduled Visit', subtitle: 'List of Scheduled Journey Cycle Plans' },
  { id: 'unscheduled_visit', icon: CalendarMinus, title: 'Unscheduled Visit', subtitle: 'Adhoc Journey Cycle Plans' },
  { id: 'visit_leave_request', icon: History, title: 'Visit/Leave Request', subtitle: 'Request for leave or customer visit' },
  { id: 'check_in_out', icon: UserCheck, title: 'Check In / Out' },
];

/** The order the learner must complete the tasks in. */
const TASK_ORDER = ['visit_leave_request', 'scheduled_visit', 'unscheduled_visit', 'check_in_out'];

/** Journey Cycle Plan as an SO/SPO sees it — opened from the Activity section of the Dashboard. */
export const SOJourneyCyclePlanScreen: React.FC<JourneyScreenProps> = (props) => (
  <JourneyCyclePlanApp rows={ROWS} content={SO_JOURNEY_CYCLE_PLAN_CONTENT} taskOrder={TASK_ORDER} {...props} />
);
