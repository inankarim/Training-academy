import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Hotspot } from '../../Hotspot';
import type { HotspotContent, LessonContent } from '../../content/types';
import { journeyMenuGuide, journeyLockedGuide } from '../../content/journeyCycleMenu';
import { PhoneFrame, ScreenTopBar, MenuRow, type ScreenTransition } from '../dashboardPrimitives';
import { VisitLeaveRequestFlow } from './VisitLeaveRequestFlow';
import { ScheduledVisitFlow } from './ScheduledVisitFlow';
import { UnscheduledVisitFlow } from './UnscheduledVisitFlow';

export interface JourneyRow {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export interface JourneyScreenProps {
  exploredHotspotIds: string[];
  onExplore: (hotspotId: string) => void;
  setGuide: (guide: HotspotContent | null) => void;
}

/** Rows that open a full guided task instead of an explanation popup. More get added here as their screens are built. */
const TASK_FLOWS = new Set(['visit_leave_request', 'scheduled_visit', 'unscheduled_visit']);

/**
 * Journey Cycle Plan as a small working app: the menu, plus a guided task
 * behind each row that has one. Tasks unlock strictly in `taskOrder` — only
 * the current one is highlighted and tappable; finished ones turn green.
 * Rows without a task flow yet show their explanation popup, and tapping
 * them (on their turn) counts as done.
 */
export const JourneyCyclePlanApp: React.FC<
  JourneyScreenProps & { rows: JourneyRow[]; content: LessonContent; taskOrder: string[] }
> = ({ rows, content, taskOrder, exploredHotspotIds, onExplore, setGuide }) => {
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [transition, setTransition] = useState<ScreenTransition>('none');
  const [tappedLocked, setTappedLocked] = useState(false);
  const explored = (id: string) => exploredHotspotIds.includes(id);

  const currentId = taskOrder.find((id) => !explored(id)) ?? null;
  const currentStep = currentId ? taskOrder.indexOf(currentId) + 1 : taskOrder.length;
  const currentTitle = rows.find((r) => r.id === currentId)?.title ?? '';

  const menuGuide = useMemo(
    () =>
      !currentId
        ? null
        : tappedLocked
          ? journeyLockedGuide(currentTitle)
          : journeyMenuGuide(currentStep, taskOrder.length, currentTitle),
    [currentId, currentStep, currentTitle, tappedLocked, taskOrder.length],
  );

  useEffect(() => {
    if (!openTask) setGuide(menuGuide);
  }, [openTask, menuGuide, setGuide]);

  const closeTask = () => {
    setTransition('pop');
    setOpenTask(null);
  };

  if (openTask === 'visit_leave_request') {
    return (
      <VisitLeaveRequestFlow setGuide={setGuide} onTaskComplete={() => onExplore('visit_leave_request')} onExit={closeTask} />
    );
  }

  if (openTask === 'unscheduled_visit') {
    return <UnscheduledVisitFlow setGuide={setGuide} onTaskComplete={() => onExplore('unscheduled_visit')} onExit={closeTask} />;
  }

  if (openTask === 'scheduled_visit') {
    return <ScheduledVisitFlow setGuide={setGuide} onTaskComplete={() => onExplore('scheduled_visit')} onExit={closeTask} />;
  }

  return (
    <PhoneFrame screenKey="jcp-menu" transition={transition}>
      <ScreenTopBar title="Journey Cycle Plan" />
      {rows.map((r) => {
        // Finished tasks stay open for review; the rest wait their turn.
        const locked = !explored(r.id) && r.id !== currentId;
        return (
          <Hotspot
            key={r.id}
            id={r.id}
            explored={explored(r.id)}
            content={content[r.id]}
            onExplore={(id) => {
              setTappedLocked(false);
              onExplore(id);
            }}
            locked={locked}
            onLockedTap={() => setTappedLocked(true)}
            showDone
            action={
              TASK_FLOWS.has(r.id)
                ? () => {
                    setTappedLocked(false);
                    setOpenTask(r.id);
                  }
                : undefined
            }
          >
            <MenuRow icon={r.icon} title={r.title} subtitle={r.subtitle} />
          </Hotspot>
        );
      })}
    </PhoneFrame>
  );
};
