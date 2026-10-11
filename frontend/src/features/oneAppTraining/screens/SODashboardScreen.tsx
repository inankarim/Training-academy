import React from 'react';
import { Map, Briefcase, Package, Users, Receipt, ClipboardCheck } from 'lucide-react';
import { Hotspot } from '../Hotspot';
import { SO_DASHBOARD_CONTENT } from '../content/soDashboard';
import {
  PhoneFrame,
  AppHeader,
  BellButton,
  FocusAreaBlock,
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
  { icon: Package, label: 'Order Management' },
  { icon: Users, label: 'Customer Management' },
  { icon: Map, label: 'Site/Project/Lead' },
  { icon: Receipt, label: 'Expense' },
  { icon: ClipboardCheck, label: 'Performance Report' },
];

/**
 * The One App Dashboard as a Sales Officer (SPO) sees it — personal figures,
 * shown in the real zero state of the SO screenshot this was built from.
 */
export const SODashboardScreen: React.FC<ScreenProps> = ({ learnerName, exploredHotspotIds, onExplore }) => {
  const content = SO_DASHBOARD_CONTENT;
  const explored = (id: string) => exploredHotspotIds.includes(id);

  return (
    <PhoneFrame>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Hotspot id="profile_role" explored={explored('profile_role')} content={content.profile_role} onExplore={onExplore}>
            <AppHeader name={learnerName} role="SPO" />
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
            <BellButton badge="23" />
          </Hotspot>
        </div>
      </div>

      <Hotspot id="focus_area" explored={explored('focus_area')} content={content.focus_area} onExplore={onExplore}>
        <FocusAreaBlock
          fields={[
            { label: 'Region', value: 'Dhaka Metro' },
            { label: 'Area', value: 'Dhaka Metro South' },
            { label: 'Territory', value: 'Narayanganj' },
            { label: 'Sub Territory', value: 'Munshiganj South' },
          ]}
        />
      </Hotspot>

      <SectionTitle>Dashboard</SectionTitle>

      <div className="grid grid-cols-2 gap-2.5">
        <Hotspot id="today_card" explored={explored('today_card')} content={content.today_card} onExplore={onExplore} fillHeight>
          <StatCard>
            <StatRow label="Today's Visits" value="0.00 %" scheduled="0/6" />
            <StatRow label="Today's Orders" value="0.00 %" scheduled="0/0" />
          </StatCard>
        </Hotspot>
        <Hotspot id="mtd_card" explored={explored('mtd_card')} content={content.mtd_card} onExplore={onExplore} fillHeight>
          <StatCard>
            <StatRow label="MTD Visits" value="0.00 %" scheduled="0/144/144" />
            <StatRow label="MTD Orders vs Delivery (Ton)" value="0.00 %" scheduled="0/0/0" showScheduledLabel={false} />
          </StatCard>
        </Hotspot>
      </div>

      <Hotspot id="summary_tiles" explored={explored('summary_tiles')} content={content.summary_tiles} onExplore={onExplore}>
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="No. of Order:" value={0} />
          <SummaryTile label="Total Order Qty:" value={0} />
          <SummaryTile label="Todays Delivery:" value={0} />
          <SummaryTile label="New Customers:" value={6} />
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
