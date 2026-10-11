import React, { useEffect, useState } from 'react';
import { MapPin, Hash, ClipboardCheck, ChevronsRight } from 'lucide-react';
import { PhoneFrame, ScreenTopBar } from '../dashboardPrimitives';
import { SCHEDULED_VISIT_GUIDE, type ScheduledVisitStep } from '../../content/scheduledVisit';
import type { HotspotContent } from '../../content/types';

const NAVY = 'text-[#0A2342]';

const SHOPS = [
  { name: 'Rahat Enterprise S S', route: 'Kuripara', shipTo: 'Rahat Enterprise S S - 43101195', type: 'Retailer', soldTo: 'Rahman Traders - 3230053' },
  { name: 'MS Jannat Enterprise', route: 'Kuripara', shipTo: 'MS Jannat Enterprise - 3331184', type: 'Retailer', soldTo: 'MS Miraj Enterprise - 3230005' },
];

function todayLabel(): string {
  const d = new Date();
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${date}, ${d.toLocaleDateString('en-GB', { weekday: 'long' })}`;
}

interface Props {
  setGuide: (guide: HotspotContent | null) => void;
  onTaskComplete: () => void;
  onExit: () => void;
}

/**
 * Journey Cycle Plan → Scheduled Visit, as a guided task (SO only). The
 * learner taps a shop, gets the real app's "not within 100 meter radius"
 * alert, and the task counts as done once they return to Journey Cycle Plan.
 */
export const ScheduledVisitFlow: React.FC<Props> = ({ setGuide, onTaskComplete, onExit }) => {
  const [tab, setTab] = useState<'visits' | 'complete'>('visits');
  const [toastKey, setToastKey] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [sawRadiusAlert, setSawRadiusAlert] = useState(false);

  const step: ScheduledVisitStep = sawRadiusAlert ? 'too_far' : tab === 'complete' ? 'complete_tab' : 'list';
  useEffect(() => {
    setGuide(SCHEDULED_VISIT_GUIDE[step]);
  }, [step, setGuide]);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(t);
  }, [showToast, toastKey]);

  const tryStartVisit = () => {
    setSawRadiusAlert(true);
    setToastKey((k) => k + 1);
    setShowToast(true);
  };

  return (
    <PhoneFrame
      screenKey="sv-list"
      transition="push"
      overlay={
        showToast && (
          <div key={toastKey} className="oa-toast rounded-2xl bg-[#F44336] px-5 py-4 text-center text-[15px] font-medium text-white shadow-lg">
            You are not within the 100 meter radius.
          </div>
        )
      }
    >
      <ScreenTopBar
        title="Scheduled Visit"
        onBack={() => {
          if (sawRadiusAlert) onTaskComplete();
          onExit();
        }}
      />

      <div className="-mx-3 grid grid-cols-2 border-b border-slate-800 text-center text-[13px] font-black">
        {(['visits', 'complete'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-2.5 ${NAVY} ${tab === t ? 'border-b-[3px] border-[#0A2E57]' : 'border-b-[3px] border-transparent'}`}
          >
            {t === 'visits' ? 'Visit List' : 'Complete List'}
          </button>
        ))}
      </div>

      {tab === 'complete' ? (
        <p className="py-16 text-center text-[13px] font-semibold text-slate-500">No completed visits yet today.</p>
      ) : (
        <>
          <div className="rounded-md bg-white p-3 shadow-md ring-1 ring-slate-100">
            <p className={`text-[15px] font-black ${NAVY}`}>Target vs Actual</p>
            <p className="text-[12px] font-bold text-slate-600">{todayLabel()}</p>
            <div className={`mt-2 flex items-center justify-between text-[14px] font-black ${NAVY}`}>
              <span>Visit</span>
              <span>0/11</span>
            </div>
            <div className="mt-2 h-5 rounded-md bg-[#EEF1FB]" />
            <div className={`mt-3 flex items-center justify-between text-[14px] font-black ${NAVY}`}>
              <span>Sales Order</span>
              <span>0.00/741.67</span>
            </div>
            <div className="mt-2 h-5 rounded-md bg-[#EEF1FB]" />
          </div>

          {SHOPS.map((s) => (
            <div
              key={s.name}
              role="button"
              tabIndex={0}
              onClick={tryStartVisit}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && tryStartVisit()}
              className="cursor-pointer rounded-md bg-white p-3 text-left shadow-md ring-1 ring-slate-100 active:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <p className={`text-[15px] font-black ${NAVY}`}>{s.name}</p>
                <MapPin className="h-6 w-6 fill-[#0A2E57] text-white" />
              </div>
              <div className="mt-1 space-y-0.5 text-[12px]">
                <p className="flex items-baseline gap-1">
                  <MapPin className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Route:</span>
                  <span className="font-semibold text-[#2E6A8E]">{s.route}</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Ship to ID:</span>
                  <span className="font-semibold text-[#2E6A8E]">{s.shipTo}</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Customer Type:</span>
                  <span className="font-semibold text-[#2E6A8E]">{s.type}</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Sold to Party:</span>
                </p>
                <p className="font-bold text-[#2E6A8E]">{s.soldTo}</p>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-sky-200 pt-2.5 text-[12px]">
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className={`h-4 w-4 ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Visit Status:</span>
                </span>
                <span className="flex items-center font-black text-[#5B7A16]">
                  Details <ChevronsRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </PhoneFrame>
  );
};
