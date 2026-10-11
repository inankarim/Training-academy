import React from 'react';
import { Map, Briefcase, Users, ShoppingCart, CopyCheck, Receipt, ClipboardCheck } from 'lucide-react';
import { Hotspot } from '../Hotspot';
import { TSM_DASHBOARD_CONTENT } from '../content/tsmDashboard';
import {
  PhoneFrame,
  AppHeader,
  BellButton,
  FocusAreaBlock,
  DateField,
  StatRow,
  StatCard,
  SummaryTile,
  ActivityTile,
  SectionTitle,
} from './dashboardPrimitives';

interface ScreenProps {
  learnerName: string;
  exploredHotspotIds: string[];
  onExplore: (hotspotId: string) => void;
}

const ACTIVITY_TILES = [
  { icon: Map, label: 'Journey Cycle Plan' },
  { icon: Briefcase, label: 'Business Development' },
  { icon: Users, label: 'SPO Management' },
  { icon: Users, label: 'Customer Management' },
  { icon: ShoppingCart, label: 'Manage Retail Order' },
  { icon: Map, label: 'Site/Project/Lead' },
  { icon: Map, label: 'Convert Project' },
  { icon: CopyCheck, label: 'MDM Approval' },
  { icon: Receipt, label: 'Expense' },
  { icon: ClipboardCheck, label: 'Performance Report' },
];

/**
 * The One App Dashboard as a Territory Sales Manager sees it. Figures are
 * the TEAM's totals (every SPO under this TSM), using the sample values from
 * the real app that the hotspot explanations walk through. Activity tiles
 * are static here — each becomes its own lesson later.
 */
export const TSMDashboardScreen: React.FC<ScreenProps> = ({ learnerName, exploredHotspotIds, onExplore }) => {
  const content = TSM_DASHBOARD_CONTENT;
  const explored = (id: string) => exploredHotspotIds.includes(id);

  return (
    <PhoneFrame>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Hotspot id="profile_role" explored={explored('profile_role')} content={content.profile_role} onExplore={onExplore}>
            <AppHeader name={learnerName} role="TSM" />
          </Hotspot>
        </div>
        <div className="w-10 shrink-0">
          <Hotspot
            id="notifications_bell"
            explored={explored('notifications_bell')}
            content={content.notifications_bell}
            onExplore={onExplore}
            popupAlign="right"
          >
            <BellButton badge="99+" />
          </Hotspot>
        </div>
      </div>

      <Hotspot id="focus_area" explored={explored('focus_area')} content={content.focus_area} onExplore={onExplore}>
        <FocusAreaBlock
          fields={[
            { label: 'Region', value: 'Dhaka Metro' },
            { label: 'Area', value: 'Dhaka Metro South' },
            { label: 'Territory', value: 'Narayanganj' },
          ]}
        />
      </Hotspot>

      <div>
        <SectionTitle>Dashboard</SectionTitle>
        <DateField value="16/09/2026" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Hotspot id="today_card" explored={explored('today_card')} content={content.today_card} onExplore={onExplore} fillHeight>
          <StatCard>
            <StatRow label="Today's Visits" value="30.23 %" scheduled="13/(5)/43" percent={30.23} figuresOnOwnLine />
            <StatRow
              label="Today's Orders (Ton)"
              value="30.11 %"
              scheduled="53/(10)/175"
              percent={30.11}
              figuresOnOwnLine
            />
          </StatCard>
        </Hotspot>
        <Hotspot id="mtd_card" explored={explored('mtd_card')} content={content.mtd_card} onExplore={onExplore} fillHeight>
          <StatCard>
            <StatRow label="MTD Visits" value="45.37 %" scheduled="318/701/1,139" percent={45.37} figuresOnOwnLine />
            <StatRow
              label="MTD Orders vs Delivery (Ton)"
              value="11.02 %"
              scheduled="194/1,763/4,550"
              percent={11.02}
              showScheduledLabel={false}
            />
          </StatCard>
        </Hotspot>
      </div>

      <Hotspot id="summary_tiles" explored={explored('summary_tiles')} content={content.summary_tiles} onExplore={onExplore}>
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="No. of Order:" value={6} />
          <SummaryTile label="Total Order Qty:" value={1254} />
          <SummaryTile label="Todays Delivery:" value={0} />
          <SummaryTile label="New Customers:" value={0} />
        </div>
      </Hotspot>

      <Hotspot
        id="activity_section"
        explored={explored('activity_section')}
        content={content.activity_section}
        onExplore={onExplore}
        popupPosition="above"
      >
        <SectionTitle>Activity</SectionTitle>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {ACTIVITY_TILES.map((t) => (
            <ActivityTile key={t.label} icon={t.icon} label={t.label} />
          ))}
        </div>
      </Hotspot>
    </PhoneFrame>
  );
};
