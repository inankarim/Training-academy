import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Hash,
  MapPin,
  ChevronsRight,
  SquareUser,
  Map as MapIcon,
  Target,
  Package,
  Sparkles,
  ImagePlus,
  CalendarDays,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { PhoneFrame, ScreenTopBar, type ScreenTransition } from '../dashboardPrimitives';
import { FormCard, OutlinedSelect, OutlinedInput, OutlinedDateInput, RadioDialog, DialogField } from '../formPrimitives';
import { UNSCHEDULED_VISIT_GUIDE, type UnscheduledVisitStep } from '../../content/unscheduledVisit';
import strongStructureImg from '../../../../assets/HolcimStrongStructure.webp';
import waterProtectImg from '../../../../assets/HolcimWaterProtect.webp';
import supercreteImg from '../../../../assets/Supercrete.webp';
import supercretePlusImg from '../../../../assets/SupercretePlus.webp';
import type { HotspotContent } from '../../content/types';

const NAVY = 'text-[#0A2342]';
const TEAL = 'text-[#2E6A8E]';

type Screen = 'list' | 'activity' | 'market' | 'addBrand' | 'sales' | 'branding' | 'picture';

const BRANDING_ITEMS = ['Festoon', 'Shop Sign', 'Sign Board', 'Shop Paint', 'Shop Marker', 'Mega Sign', 'Water Dispenser', 'TLP Registration'];

/** The visit's 4 activities, in the order they unlock. */
const ACTIVITY_ORDER = ['market', 'sales', 'branding', 'picture'] as const;
type ActivityKey = (typeof ACTIVITY_ORDER)[number];
const LATER_HINT: Record<ActivityKey, 'activity_later' | 'activity_later_sales' | 'activity_later_branding' | 'activity_later_picture'> = {
  market: 'activity_later',
  sales: 'activity_later_sales',
  branding: 'activity_later_branding',
  picture: 'activity_later_picture',
};

const SHOPS = [
  { name: 'ICHAPURI CEMENT HOUSE', route: 'Kanchon', shipTo: '3314225', soldTo: ['Ta-Sin Enterprise - 3232955', 'MS Miraj Enterprise - 3230005'] },
  { name: 'Mamun Trader', route: 'Kuripara', shipTo: '3325588', soldTo: ['Zonaid Traders - 3229560'] },
  { name: 'M/S Saifullah Enterprise', route: 'Kuripara', shipTo: '3326457', soldTo: ['Zonaid Traders - 3229560'] },
  { name: 'Habib Brothers', route: 'Modonpur', shipTo: '3330005', soldTo: ['Rahman Traders - 3230053'] },
];

const CEMENT_BRANDS = ['Holcim SS', 'Supercrete', 'Crown', 'Fresh', 'Akij', 'Bashundhara', 'Insee'];

const ACTIVITIES: Array<{ key: string; label: string; checklist: string; icon: LucideIcon }> = [
  { key: 'market', label: 'Collect Market Info', checklist: 'Market Info:', icon: Target },
  { key: 'sales', label: 'Collect Sales Order', checklist: 'Sales order:', icon: Package },
  { key: 'branding', label: 'Survey Shop Branding', checklist: 'Shop branding:', icon: Sparkles },
  { key: 'picture', label: 'Take a Picture', checklist: 'Take a picture:', icon: ImagePlus },
];

const PRODUCTS: Array<{ name: string; image: string }> = [
  { name: 'Holcim Strong Structure 2 Ply', image: strongStructureImg },
  { name: 'SUPERCRETE 50KG BAG 1 Ply', image: supercreteImg },
  { name: 'Holcim Water Protect', image: waterProtectImg },
  { name: 'Supercrete Plus', image: supercretePlusImg },
  { name: 'Supercrete 50 KG Bag 2 Ply', image: supercreteImg },
];

function ProductThumb({ name }: { name: string }) {
  const product = PRODUCTS.find((p) => p.name === name);
  if (!product) return null;
  // The photos are wide, with the bag left of centre — crop to the bag.
  return (
    <img
      src={product.image}
      alt=""
      className="h-12 w-12 shrink-0 rounded-sm bg-slate-200 object-cover"
      style={{ objectPosition: '32% center' }}
    />
  );
}

const EMPTY_SALES = { product: '', wsp: '', qty: '', address: '' as 'retail' | 'unload' | '', date: '' };
type SalesForm = typeof EMPTY_SALES;

function validateSales(f: SalesForm): Partial<Record<keyof SalesForm, string>> {
  const errors: Partial<Record<keyof SalesForm, string>> = {};
  if (!f.product) errors.product = 'Choose a product';
  if (!(num(f.wsp) > 0)) errors.wsp = 'Enter a number above 0';
  if (!(num(f.qty) > 0) || !Number.isInteger(num(f.qty))) errors.qty = 'Enter a whole number of bags';
  if (f.address !== 'retail') errors.address = 'Choose Retail shop address';
  if (!f.date) errors.date = 'Choose a date';
  return errors;
}

const EMPTY_BRAND = { brand: '', volume: '', wsp: '', rsp: '', stock: '', credit: '', cash: '', branding: '' as 'yes' | 'no' | '' };
type BrandForm = typeof EMPTY_BRAND;
type NumberField = 'volume' | 'wsp' | 'rsp' | 'stock' | 'credit' | 'cash';

function monthOffset(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d;
}
const monthLong = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
const monthShort = (d: Date) => `${d.toLocaleDateString('en-GB', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;

function num(s: string): number {
  return s.trim() === '' ? NaN : Number(s);
}

/** Field-level problems with the Add Brand form, or an empty object if it's valid. */
function validateBrand(f: BrandForm): Partial<Record<keyof BrandForm, string>> {
  const errors: Partial<Record<keyof BrandForm, string>> = {};
  if (!f.brand) errors.brand = 'Choose a brand';
  const positive: NumberField[] = ['volume', 'wsp', 'rsp'];
  const zeroOk: NumberField[] = ['stock', 'credit', 'cash'];
  positive.forEach((k) => {
    const v = num(f[k]);
    if (!Number.isFinite(v) || v <= 0) errors[k] = 'Enter a number above 0';
  });
  zeroOk.forEach((k) => {
    const v = num(f[k]);
    if (!Number.isFinite(v) || v < 0) errors[k] = 'Enter a number (0 if none)';
  });
  if (!errors.wsp && !errors.rsp && num(f.rsp) <= num(f.wsp)) errors.rsp = 'RSP must be higher than WSP';
  if (!f.branding) errors.branding = 'Choose Yes or No';
  return errors;
}

interface Props {
  setGuide: (guide: HotspotContent | null) => void;
  onTaskComplete: () => void;
  onExit: () => void;
}

/**
 * Journey Cycle Plan → Unscheduled Visit, as a guided task (SO only):
 * pick the shop, open its Visit Activity, Collect Market Info, and survey
 * one cement brand. RSP must be higher than WSP, so made-up numbers fail.
 */
export const UnscheduledVisitFlow: React.FC<Props> = ({ setGuide, onTaskComplete, onExit }) => {
  const [screen, setScreen] = useState<Screen>('list');
  const [transition, setTransition] = useState<ScreenTransition>('push');
  const [hint, setHint] = useState<
    'wrong_shop' | 'market_submit_empty' | (typeof LATER_HINT)[ActivityKey] | null
  >(null);
  const [brandingTicked, setBrandingTicked] = useState<string[]>([]);
  const [triedBranding, setTriedBranding] = useState(false);
  const [brandingDone, setBrandingDone] = useState(false);
  // Capturing is simulated — tapping the button is enough; no real photo is taken.
  const [photoTaken, setPhotoTaken] = useState(false);
  const [flash, setFlash] = useState(false);
  const [triedPicture, setTriedPicture] = useState(false);
  const [pictureDone, setPictureDone] = useState(false);
  const [sales, setSales] = useState<SalesForm>(EMPTY_SALES);
  const [triedSales, setTriedSales] = useState(false);
  const [productDialog, setProductDialog] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [salesDiscarded, setSalesDiscarded] = useState(false);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [form, setForm] = useState<BrandForm>(EMPTY_BRAND);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [brandDialog, setBrandDialog] = useState<string | null>(null);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [addedBrands, setAddedBrands] = useState<string[]>([]);
  const [marketSubmitted, setMarketSubmitted] = useState(false);

  const go = (next: Screen, how: ScreenTransition) => {
    setTransition(how);
    setScreen(next);
    setHint(null);
    setBrandingOpen(false);
    setAddressOpen(false);
  };

  const errors = validateBrand(form);
  const shownErrors = triedSubmit ? errors : {};
  const salesErrors = validateSales(sales);
  const shownSalesErrors = triedSales ? salesErrors : {};

  const activityDone: Record<ActivityKey, boolean> = {
    market: marketSubmitted,
    sales: salesSubmitted,
    branding: brandingDone,
    picture: pictureDone,
  };
  const nextActivity = ACTIVITY_ORDER.find((k) => !activityDone[k]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 180);
    return () => clearTimeout(t);
  }, [flash]);

  let step: UnscheduledVisitStep;
  if (hint) step = hint;
  else if (pictureDone) step = 'visit_done';
  else if (screen === 'picture') step = photoTaken ? 'picture_taken' : triedPicture ? 'picture_missing' : 'picture_capture';
  else if (screen === 'branding') step = triedBranding && brandingTicked.length === 0 ? 'branding_none' : 'branding_choose';
  else if (brandingDone) step = 'branding_done';
  else if (salesSubmitted) step = 'sales_submitted';
  else if (screen === 'sales') {
    if (!sales.product) step = 'sales_product';
    else if (sales.address === 'unload') step = 'sales_unload';
    else if (triedSales && Object.keys(salesErrors).length > 0) step = 'sales_missing';
    else step = 'sales_fill';
  } else if (marketSubmitted) step = salesDiscarded ? 'sales_discarded' : 'market_submitted';
  else if (screen === 'market' && addedBrands.length > 0) step = 'brand_added';
  else if (screen === 'list') step = 'list';
  else if (screen === 'activity') step = 'activity';
  else if (screen === 'market') step = 'market';
  else if (!form.brand) step = 'choose_brand';
  else if (triedSubmit && errors.rsp === 'RSP must be higher than WSP') step = 'rsp_not_higher';
  else if (triedSubmit && Object.keys(errors).length > 0) step = 'brand_missing';
  else step = 'fill_brand';

  useEffect(() => {
    setGuide(UNSCHEDULED_VISIT_GUIDE[step]);
  }, [step, setGuide]);

  const update = (patch: Partial<BrandForm>) => setForm((f) => ({ ...f, ...patch }));

  if (screen === 'list') {
    return (
      <PhoneFrame screenKey="uv-list" transition={transition}>
        <ScreenTopBar title="Unscheduled Visit" onBack={onExit} showSearch />
        <div className="flex items-start gap-3 rounded-md border border-yellow-300 bg-[#FDF3B5] px-3 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <p className="text-[13px] font-extrabold text-slate-900">Please Select A Ship To Party For Unscheduled Visit.</p>
        </div>
        {SHOPS.map((s, i) => (
          <div
            key={s.name}
            role="button"
            tabIndex={0}
            onClick={() => (i === 0 ? go('activity', 'push') : setHint('wrong_shop'))}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (i === 0 ? go('activity', 'push') : setHint('wrong_shop'))}
            className="cursor-pointer rounded-md bg-[#E8E9EC] p-3 text-left shadow-md active:brightness-95"
          >
            <p className={`text-[15px] font-black ${NAVY}`}>{s.name}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0 space-y-0.5 text-[12px]">
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Customer Type:</span>
                  <span className={`font-semibold ${TEAL}`}>Retailer</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <MapPin className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Route:</span>
                  <span className={`font-semibold ${TEAL}`}>{s.route}</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Ship to ID:</span>
                  <span className={`font-semibold ${TEAL}`}>{s.shipTo}</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <Hash className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>Sold to Party:</span>
                </p>
                {s.soldTo.map((p) => (
                  <p key={p} className={`font-bold ${TEAL}`}>
                    {p}
                  </p>
                ))}
              </div>
              <MapPin className="h-6 w-6 shrink-0 fill-[#0A2E57] text-white" />
            </div>
            <p className="mt-1 flex items-center justify-end text-[12px] font-black text-[#5B7A16]">
              Details <ChevronsRight className="h-4 w-4" />
            </p>
          </div>
        ))}
      </PhoneFrame>
    );
  }

  if (screen === 'activity') {
    return (
      <PhoneFrame screenKey="uv-activity" transition={transition}>
        <ScreenTopBar title="Visit Activity" onBack={() => go('list', 'pop')} backStyle="arrow" showMenu={false} />
        <div className="rounded-md bg-[#E8E9EC] p-3 shadow-md">
          <p className={`text-[15px] font-black ${NAVY}`}>ICHAPURI CEMENT HOUSE</p>
          <div className="mt-1.5 space-y-0.5 text-[12px]">
            {[
              { icon: SquareUser, label: 'Owner:', value: 'Md Jakir Hossain' },
              { icon: SquareUser, label: 'Customer Type:', value: 'Retailer' },
              { icon: MapPin, label: 'Location:', value: 'Khan Market, Kunda, kanchan,' },
              { icon: Hash, label: 'Ship to ID:', value: '3314225' },
              { icon: MapIcon, label: 'Visit type:', value: 'Unscheduled' },
            ].map(({ icon: Icon, label, value }) => (
              <p key={label} className="flex items-baseline gap-1">
                <Icon className={`h-3.5 w-3.5 self-center ${NAVY}`} />
                <span className={`font-black ${NAVY}`}>{label}</span>
                <span className={`font-semibold ${TEAL}`}>{value}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-[#E8E9EC] p-3 shadow-md">
          <p className={`text-[15px] font-black ${NAVY}`}>Activity Checklist</p>
          <div className="mt-1.5 space-y-1.5 text-[12px]">
            {ACTIVITIES.map(({ key, checklist, icon: Icon }) => {
              const done = activityDone[key as ActivityKey];
              return (
                <p key={key} className="flex items-center gap-1">
                  <Icon className={`h-3.5 w-3.5 ${NAVY}`} />
                  <span className={`font-black ${NAVY}`}>{checklist}</span>
                  {done ? (
                    <span className="oa-drop ml-1 flex items-center gap-1 rounded bg-green-200 px-2 py-0.5 text-[13px] font-black text-green-900">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Done
                    </span>
                  ) : (
                    <span className="ml-1 flex items-center gap-1 rounded bg-sky-200 px-2 py-0.5 text-[13px] font-black text-[#0A2342]">
                      <AlertCircle className="h-3.5 w-3.5" /> No Status
                    </span>
                  )}
                </p>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {ACTIVITIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const k = key as ActivityKey;
                if (activityDone[k]) return;
                if (k !== nextActivity) {
                  if (nextActivity) setHint(LATER_HINT[nextActivity]);
                  return;
                }
                if (k === 'market') go('market', 'push');
                else if (k === 'sales') {
                  setSales(EMPTY_SALES);
                  setTriedSales(false);
                  setSalesDiscarded(false);
                  go('sales', 'push');
                } else if (k === 'branding') {
                  setBrandingTicked([]);
                  setTriedBranding(false);
                  go('branding', 'push');
                } else {
                  setTriedPicture(false);
                  setPhotoTaken(false);
                  go('picture', 'push');
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0F6585] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-110"
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </PhoneFrame>
    );
  }

  if (screen === 'market') {
    const prev = monthOffset(-1);
    return (
      <PhoneFrame
        screenKey="uv-market"
        transition={transition}
        footer={
          <button
            type="button"
            onClick={() => {
              if (addedBrands.length === 0) {
                setHint('market_submit_empty');
                return;
              }
              setMarketSubmitted(true);
              go('activity', 'pop');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0A2E57] py-3 text-[14px] font-extrabold text-white shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" /> Submit Market Info
          </button>
        }
      >
        <ScreenTopBar title="Market Info" onBack={() => go('activity', 'pop')} />
        <div className="rounded-md bg-[#E8E9EC] p-3 shadow-md">
          <p className={`text-[15px] font-black ${NAVY}`}>General Information</p>
          <div className="mt-2 flex gap-4">
            {[monthLong(monthOffset(0)), String(monthOffset(0).getFullYear())].map((v) => (
              <span key={v} className="flex items-center gap-6 border-b border-slate-300 pb-1 text-[15px] font-black text-slate-900">
                {v} <span className="text-[10px] text-slate-500">▼</span>
              </span>
            ))}
          </div>
          <p className="mt-2 px-3 text-[12px] font-bold text-slate-600">Last months total sales volume</p>
          <p className="px-3 text-[15px] font-black text-slate-900">0</p>
        </div>

        <div className="rounded-md bg-[#E8E9EC] p-3 shadow-md">
          <p className={`text-[15px] font-black ${NAVY}`}>Brand Wise Sales</p>
          <p className="flex items-center gap-1 text-[12px]">
            <CalendarDays className={`h-3.5 w-3.5 ${NAVY}`} />
            <span className={`font-black ${NAVY}`}>Previous Month:</span>
            <span className={`font-semibold ${TEAL}`}>
              {monthLong(prev)} {prev.getFullYear()}
            </span>
          </p>
          <div className="mt-2 overflow-hidden rounded">
            <div className="grid grid-cols-3 bg-[#0A2E57] px-3 py-2.5 text-[11px] font-black text-white">
              <span>Brand Name</span>
              <span>{monthShort(prev)} SOW</span>
              <span>{monthShort(monthOffset(-2))} SOW</span>
            </div>
            {addedBrands.map((b) => (
              <div key={b} className="oa-drop grid grid-cols-3 border-b border-slate-300 bg-white px-3 py-2.5 text-[12px] font-bold text-slate-900">
                <span>{b}</span>
                <span>—</span>
                <span>—</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_BRAND);
              setTriedSubmit(false);
              go('addBrand', 'push');
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-lime-600 bg-[#C5EE5B] py-2.5 text-[14px] font-extrabold text-slate-900 shadow-md active:brightness-95"
          >
            <PlusCircle className="h-4 w-4" /> Add Brand Info
          </button>
        </div>
      </PhoneFrame>
    );
  }

  if (screen === 'branding') {
    return (
      <PhoneFrame
        screenKey="uv-branding"
        transition={transition}
        footer={
          <button
            type="button"
            onClick={() => {
              setTriedBranding(true);
              if (brandingTicked.length === 0) return;
              setBrandingDone(true);
              go('activity', 'pop');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3D8BE0] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-95"
          >
            <CheckCircle2 className="h-4 w-4" /> Complete Shop Branding
          </button>
        }
      >
        <ScreenTopBar title="Shop Branding" onBack={() => go('activity', 'pop')} />
        {BRANDING_ITEMS.map((item) => {
          const ticked = brandingTicked.includes(item);
          return (
            <button
              key={item}
              type="button"
              role="checkbox"
              aria-checked={ticked}
              onClick={() =>
                setBrandingTicked((t) => (ticked ? t.filter((x) => x !== item) : [...t, item]))
              }
              className={`flex w-full items-center gap-4 rounded-md bg-[#E8E9EC] px-4 py-3.5 text-left shadow-md ${
                triedBranding && brandingTicked.length === 0 ? 'ring-1 ring-red-400' : ''
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 border-slate-900 ${
                  ticked ? 'bg-[#0A2E57]' : 'bg-transparent'
                }`}
              >
                {ticked && <span className="text-[10px] font-black leading-none text-white">✓</span>}
              </span>
              <span className={`text-[15px] font-black ${NAVY}`}>{item}</span>
            </button>
          );
        })}
      </PhoneFrame>
    );
  }

  if (screen === 'picture') {
    return (
      <PhoneFrame
        screenKey="uv-picture"
        transition={transition}
        overlay={flash && <div className="absolute inset-0 bg-white" />}
        footer={
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setFlash(true);
                setPhotoTaken(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-lime-600 bg-[#C5EE5B] py-3 text-[14px] font-extrabold text-slate-900 shadow-md active:brightness-95"
            >
              <ImagePlus className="h-4 w-4" /> Capture a Picture
            </button>
            <button
              type="button"
              onClick={() => {
                setTriedPicture(true);
                if (!photoTaken) return;
                setPictureDone(true);
                go('activity', 'pop');
                onTaskComplete();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3D8BE0] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-95"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit
            </button>
          </div>
        }
      >
        <ScreenTopBar title="Take a Picture" onBack={() => go('activity', 'pop')} />
        <div className="flex flex-col items-center px-2 pt-10 text-center">
          {photoTaken ? (
            <div className="oa-drop flex h-56 w-full flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-b from-slate-300 to-slate-400 shadow-md">
              <Store className="h-16 w-16 text-white" strokeWidth={1.5} />
              <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[11px] font-bold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Picture captured
              </span>
            </div>
          ) : (
            <ImagePlus className="h-40 w-40 text-[#A9C4F5]" strokeWidth={1.75} />
          )}
          <p className="mt-6 text-[16px] font-black leading-snug text-slate-700">
            Capture a picture of merchandizing or visit requirements/proof of activity
          </p>
        </div>
      </PhoneFrame>
    );
  }

  if (screen === 'sales') {
    const total = (num(sales.wsp) || 0) * (num(sales.qty) || 0);
    const updateSales = (patch: Partial<SalesForm>) => setSales((s) => ({ ...s, ...patch }));
    return (
      <PhoneFrame
        screenKey="uv-sales"
        transition={transition}
        footer={
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setSalesDiscarded(true);
                go('activity', 'pop');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-red-400 bg-red-100 py-3 text-[14px] font-extrabold text-red-700 active:brightness-95"
            >
              <Trash2 className="h-4 w-4" /> Discard Sales Order
            </button>
            <button
              type="button"
              onClick={() => {
                setTriedSales(true);
                if (Object.keys(salesErrors).length > 0) return;
                setSalesSubmitted(true);
                go('activity', 'pop');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3D8BE0] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-95"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit Sales Order
            </button>
          </div>
        }
        modal={
          productDialog !== null && (
            <RadioDialog
              title="Select Product"
              options={PRODUCTS.map((p) => p.name)}
              selected={productDialog}
              onSelect={setProductDialog}
              onCancel={() => setProductDialog(null)}
              onOk={() => {
                updateSales({ product: productDialog });
                setProductDialog(null);
              }}
              renderThumb={(name) => <ProductThumb name={name} />}
            />
          )
        }
      >
        <ScreenTopBar title="Place Sales Order" onBack={() => go('activity', 'pop')} />
        <FormCard title="Order Information">
          <DialogField
            label="Product"
            value={sales.product}
            invalid={Boolean(shownSalesErrors.product)}
            onClick={() => setProductDialog(sales.product)}
          />
          <OutlinedInput variant="light" numeric label="WSP Per Bags" value={sales.wsp} onChange={(wsp) => updateSales({ wsp })} error={shownSalesErrors.wsp} />
          <OutlinedInput variant="light" numeric label="Order quantity" value={sales.qty} onChange={(qty) => updateSales({ qty })} error={shownSalesErrors.qty} />
          <div className="px-3">
            <p className="text-[12px] font-bold text-slate-600">Total Amount</p>
            <p className="text-[16px] font-black text-slate-900">{total.toFixed(1)} BDT</p>
          </div>
        </FormCard>
        <FormCard title="Delivery Information">
          <div>
            <OutlinedSelect
              label="Delivery Address"
              value={sales.address}
              options={[
                { value: 'retail', label: 'Retail shop address' },
                { value: 'unload', label: 'Unload site address' },
              ]}
              open={addressOpen}
              onToggle={() => setAddressOpen((o) => !o)}
              onSelect={(address) => {
                updateSales({ address });
                setAddressOpen(false);
              }}
            />
            {shownSalesErrors.address && <p className="mt-1 px-1 text-[11px] font-bold text-red-600">{shownSalesErrors.address}</p>}
          </div>
          <OutlinedDateInput
            label="Expected delivery date"
            value={sales.date}
            onChange={(date) => updateSales({ date })}
            invalid={Boolean(shownSalesErrors.date)}
          />
        </FormCard>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame
      screenKey="uv-add-brand"
      transition={transition}
      footer={
        <button
          type="button"
          onClick={() => {
            setTriedSubmit(true);
            if (Object.keys(errors).length > 0) return;
            setAddedBrands((bs) => [...bs, form.brand]);
            go('market', 'pop');
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3D8BE0] py-3 text-[14px] font-extrabold text-white shadow-md active:brightness-95"
        >
          <CheckCircle2 className="h-4 w-4" /> Complete Adding Brand
        </button>
      }
      modal={
        brandDialog !== null && (
          <RadioDialog
            title="Select Cement Brand"
            options={CEMENT_BRANDS}
            selected={brandDialog}
            onSelect={setBrandDialog}
            onCancel={() => setBrandDialog(null)}
            onOk={() => {
              update({ brand: brandDialog });
              setBrandDialog(null);
            }}
          />
        )
      }
    >
      <ScreenTopBar title="Add Brand" onBack={() => go('market', 'pop')} />
      <FormCard title="Brand Information">
        <DialogField label="Cement Brand" value={form.brand} invalid={Boolean(shownErrors.brand)} onClick={() => setBrandDialog(form.brand)} />
        <OutlinedInput variant="light" numeric label="Monthly Sales Volume (Bags)" value={form.volume} onChange={(volume) => update({ volume })} error={shownErrors.volume} />
        <OutlinedInput variant="light" numeric label="WSP" value={form.wsp} onChange={(wsp) => update({ wsp })} error={shownErrors.wsp} />
        <OutlinedInput variant="light" numeric label="RSP" value={form.rsp} onChange={(rsp) => update({ rsp })} error={shownErrors.rsp} />
        <OutlinedInput variant="light" numeric label="Stock (Bag)" value={form.stock} onChange={(stock) => update({ stock })} error={shownErrors.stock} />
        <OutlinedInput variant="light" numeric label="Brand's Total Credit (Lac)" value={form.credit} onChange={(credit) => update({ credit })} error={shownErrors.credit} />
        <OutlinedInput variant="light" numeric label="Cash Offer" value={form.cash} onChange={(cash) => update({ cash })} error={shownErrors.cash} />
        <div>
          <OutlinedSelect
            label="Shop Branding"
            value={form.branding}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            open={brandingOpen}
            onToggle={() => setBrandingOpen((o) => !o)}
            onSelect={(branding) => {
              update({ branding });
              setBrandingOpen(false);
            }}
          />
          {shownErrors.branding && <p className="mt-1 px-1 text-[11px] font-bold text-red-600">{shownErrors.branding}</p>}
        </div>
      </FormCard>
    </PhoneFrame>
  );
};
