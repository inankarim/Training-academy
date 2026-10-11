import React, { useEffect, useState } from 'react';
import { History, CalendarCheck, CalendarDays, ClipboardCheck, AlertCircle, ChevronsRight, Pencil, Eye, X, CheckCircle2 } from 'lucide-react';
import { PhoneFrame, ScreenTopBar, type ScreenTransition } from '../dashboardPrimitives';
import {
  FormCard,
  OutlinedSelect,
  OutlinedInput,
  OutlinedDateInput,
  PreviewField,
  formatDateField,
  formatDateCard,
} from '../formPrimitives';
import { VISIT_LEAVE_REQUEST_GUIDE, type VisitLeaveStep } from '../../content/visitLeaveRequest';
import type { HotspotContent } from '../../content/types';

type Screen = 'list' | 'create' | 'preview';
type RequestType = 'visit' | 'leave';
type Duration = 'single' | 'multiple';

interface SentRequest {
  id: number;
  type: string;
  duration: string;
  date: string;
}

// The pending request every account starts with in the real app screenshot.
const SAMPLE_REQUEST: SentRequest = { id: 0, type: 'Visit Request', duration: 'Single day', date: '01 May 2025' };

const EMPTY_FORM = { type: '' as RequestType | '', duration: '' as Duration | '', date: '', company: '', address: '', purpose: '' };

interface Props {
  setGuide: (guide: HotspotContent | null) => void;
  onTaskComplete: () => void;
  onExit: () => void;
}

/**
 * Journey Cycle Plan → Visit/Leave Request, as a guided task: open the list,
 * tap Request, create a single-day visit request, preview it, and send it.
 * The learner really fills the form; nothing is sent anywhere — completing
 * it only marks this task done.
 */
export const VisitLeaveRequestFlow: React.FC<Props> = ({ setGuide, onTaskComplete, onExit }) => {
  const [screen, setScreen] = useState<Screen>('list');
  const [transition, setTransition] = useState<ScreenTransition>('push');
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMenu, setOpenMenu] = useState<'type' | 'duration' | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [notice, setNotice] = useState<'cancelled' | 'done' | null>(null);
  const [requests, setRequests] = useState<SentRequest[]>([SAMPLE_REQUEST]);
  const [toast, setToast] = useState(false);

  const go = (next: Screen, how: ScreenTransition) => {
    setTransition(how);
    setScreen(next);
    setOpenMenu(null);
  };

  const detailsComplete = Boolean(form.date && form.company.trim() && form.address.trim() && form.purpose.trim());

  let step: VisitLeaveStep;
  if (screen === 'list') step = notice ?? 'list';
  else if (screen === 'preview') step = 'preview';
  else if (form.type === 'leave') step = 'chose_leave';
  else if (form.type !== 'visit') step = 'choose_type';
  else if (form.duration === 'multiple') step = 'chose_multiple';
  else if (form.duration !== 'single') step = 'choose_duration';
  else if (showMissing && !detailsComplete) step = 'missing_details';
  else step = 'fill_details';

  useEffect(() => {
    setGuide(VISIT_LEAVE_REQUEST_GUIDE[step]);
  }, [step, setGuide]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }));

  if (screen === 'list') {
    return (
      <PhoneFrame
        screenKey="vlr-list"
        transition={transition}
        footer={
          <div className="relative flex justify-end">
            {toast && (
              <div className="oa-toast absolute -top-14 left-0 right-0 rounded-md bg-slate-800 px-4 py-2.5 text-center text-[13px] font-semibold text-white shadow-lg">
                Request sent successfully
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                go('create', 'push');
              }}
              className="flex items-center gap-3 rounded-2xl bg-[#2F5283] px-6 py-4 text-[14px] font-extrabold text-white shadow-lg active:scale-95"
            >
              <Pencil className="h-4 w-4" /> Request
            </button>
          </div>
        }
      >
        <ScreenTopBar title="Visit/Leave Request" onBack={onExit} showSearch />
        {requests.map((r) => (
          <div key={r.id} className={`rounded-md bg-[#E8E9EC] p-3 shadow-md ${r.id !== 0 && r.id === requests[0].id ? 'oa-drop' : ''}`}>
            <div className="space-y-1 text-[12px]">
              <p className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-[#0A2342]" />
                <span className="font-black text-[#0A2342]">Request type:</span>
                <span className="font-semibold text-[#2E6A8E]">{r.type}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-[#0A2342]" />
                <span className="font-black text-[#0A2342]">Duration of leave</span>
                <span className="font-semibold text-[#2E6A8E]">{r.duration}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#0A2342]" />
                <span className="font-black text-[#0A2342]">Date of leave:</span>
                <span className="font-semibold text-[#2E6A8E]">{r.date}</span>
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-sky-200 pt-2.5 text-[12px]">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-[#0A2342]" />
                <span className="font-black text-[#0A2342]">Request Status:</span>
                <span className="ml-1 flex items-center gap-1 rounded bg-sky-200 px-2 py-0.5 text-[13px] font-black text-[#0A2342]">
                  <AlertCircle className="h-3.5 w-3.5" /> Pending
                </span>
              </span>
              <span className="flex items-center font-black text-[#5B7A16]">
                Details <ChevronsRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </PhoneFrame>
    );
  }

  if (screen === 'create') {
    const showVisitInfo = form.type === 'visit' && form.duration === 'single';
    return (
      <PhoneFrame
        screenKey="vlr-create"
        transition={transition}
        footer={
          <button
            type="button"
            onClick={() => {
              if (!showVisitInfo) return;
              if (!detailsComplete) {
                setShowMissing(true);
                return;
              }
              go('preview', 'push');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3D8BE0] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-95"
          >
            <Eye className="h-4 w-4" /> Preview Request Creation
          </button>
        }
      >
        <ScreenTopBar title="Create Request" onBack={() => go('list', 'pop')} />
        <FormCard title="Request Information">
          <OutlinedSelect
            label="Request type"
            value={form.type}
            options={[
              { value: 'visit', label: 'Visit request' },
              { value: 'leave', label: 'Leave request' },
            ]}
            open={openMenu === 'type'}
            onToggle={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
            onSelect={(v) => {
              update({ type: v, duration: '' });
              setOpenMenu(null);
            }}
          />
          {form.type === 'visit' && (
            <OutlinedSelect
              label="Duration of visit"
              value={form.duration}
              options={[
                { value: 'single', label: 'Single day' },
                { value: 'multiple', label: 'Multiple days' },
              ]}
              open={openMenu === 'duration'}
              onToggle={() => setOpenMenu(openMenu === 'duration' ? null : 'duration')}
              onSelect={(v) => {
                update({ duration: v });
                setOpenMenu(null);
              }}
            />
          )}
        </FormCard>

        {showVisitInfo && (
          <div className="oa-drop">
            <FormCard title="Visit Information">
              <OutlinedDateInput
                label="Date of visit"
                value={form.date}
                onChange={(date) => update({ date })}
                invalid={showMissing && !form.date}
              />
              <OutlinedInput
                label="Company name"
                value={form.company}
                onChange={(company) => update({ company })}
                invalid={showMissing && !form.company.trim()}
              />
              <OutlinedInput
                label="Address"
                value={form.address}
                onChange={(address) => update({ address })}
                invalid={showMissing && !form.address.trim()}
              />
              <OutlinedInput
                label="Purpose of visit"
                value={form.purpose}
                onChange={(purpose) => update({ purpose })}
                invalid={showMissing && !form.purpose.trim()}
              />
            </FormCard>
          </div>
        )}
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame
      screenKey="vlr-preview"
      transition={transition}
      footer={
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowMissing(false);
              setNotice('cancelled');
              go('list', 'pop');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-red-400 bg-red-100 py-3 text-[14px] font-extrabold text-red-700 active:brightness-95"
          >
            <X className="h-4 w-4" /> Cancel Request
          </button>
          <button
            type="button"
            onClick={() => {
              setRequests((rs) => [
                { id: Date.now(), type: 'Visit Request', duration: 'Single day', date: formatDateCard(form.date) },
                ...rs,
              ]);
              setForm(EMPTY_FORM);
              setShowMissing(false);
              setNotice('done');
              setToast(true);
              go('list', 'pop');
              onTaskComplete();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0A2E57] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-110"
          >
            <CheckCircle2 className="h-4 w-4" /> Complete Request Creation
          </button>
        </div>
      }
    >
      <ScreenTopBar title="Preview Request Creation" onBack={() => go('create', 'pop')} />
      <div className="flex items-start gap-3 rounded-md border border-yellow-300 bg-[#FDF3B5] px-3 py-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
        <p className="text-[13px] font-extrabold text-slate-900">Please confirm details before you complete Request Creation.</p>
      </div>
      <FormCard title="Request Information">
        <PreviewField label="Request type" value="Visit request" />
        <PreviewField label="Duration of visit" value="Single day" />
      </FormCard>
      <FormCard title="Visit Information">
        <PreviewField label="Date of visit" value={formatDateField(form.date)} />
        <PreviewField label="Company name" value={form.company} />
        <PreviewField label="Company address" value={form.address} />
        <PreviewField label="Purpose of visit" value={form.purpose} />
      </FormCard>
    </PhoneFrame>
  );
};
