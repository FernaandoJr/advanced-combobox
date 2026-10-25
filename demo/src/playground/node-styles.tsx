import {
  Building2,
  ChartLine,
  Globe,
  LayoutGrid,
  MapPin,
  MapPinned,
  Network,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PersonRole, PlaygroundRow } from "./fixtures";
import type { DatasetKey } from "./datasets";

/*
  Node style catalog: runnable customLabel / customStartNode recipes taken from
  how one/src uses the Combobox in production (avatar initials, role badges,
  type icons, conditional "New" badges, two-line rows, plate chips, spicy
  flags...). Every style carries a runtime renderer AND the exact codegen
  source string, so the generated snippet renders exactly like the preview —
  no placeholders.
*/

export type NodeStyleKind = "menuLabel" | "menuStart" | "selectedLabel" | "selectedStart";

interface RoleBadge {
  label: string;
  variant: "destructive" | "default" | "secondary";
}

const ROLE_BADGES: Record<PersonRole, RoleBadge> = {
  admin: { label: "Admin", variant: "destructive" },
  manager: { label: "Manager", variant: "default" },
  user: { label: "User", variant: "secondary" },
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

const ROLE_BADGE_HELPERS = [
  `const ROLE_BADGES = {`,
  `  admin: { label: "Admin", variant: "destructive" as const },`,
  `  manager: { label: "Manager", variant: "default" as const },`,
  `  user: { label: "User", variant: "secondary" as const },`,
  `};`,
].join("\n");

const PLUGIN_ICON_HELPERS = [
  `const ICONS = {`,
  `  layout: LayoutGrid,`,
  `  chart: ChartLine,`,
  `  sparkles: Sparkles,`,
  `};`,
].join("\n");

const FOOD_EMOJI_HELPERS = [
  `const FOOD_EMOJI = {`,
  `  dish: "🍛",`,
  `  dessert: "🍮",`,
  `  drink: "🥤",`,
  `};`,
].join("\n");

export const TREE_ICON_HELPERS = [
  `const KIND_ICONS = {`,
  `  super: Network,`,
  `  continent: Globe,`,
  `  country: Building2,`,
  `  state: MapPinned,`,
  `  city: MapPin,`,
  `};`,
].join("\n");

export interface NodeStyleSpec {
  key: string;
  label: string;
  /** Datasets this style makes sense for. */
  datasets: DatasetKey[];
  kinds: NodeStyleKind[];
  /** Helper consts the generated code needs above the component. */
  helpers?: string[];
  /** Lucide icons the generated code must import. */
  importNames?: string[];
  renderLabel?: (item: PlaygroundRow) => React.ReactNode;
  renderStart?: (item: PlaygroundRow) => React.ReactNode;
  /** Codegen: exact arrow-function text for customLabel (unindented). */
  codeLabel?: string;
  /** Codegen: exact arrow-function text for customStartNode (unindented). */
  codeStart?: string;
}

const AVATAR_CODE = [
  `(item) => (`,
  `  <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold'>`,
  `    {item.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}`,
  `  </span>`,
  `)`,
].join("\n");

const ROLE_BADGE_CODE = [
  `(item) => {`,
  `  const badge = ROLE_BADGES[item.role ?? "user"];`,
  `  return (`,
  `    <span className='flex min-w-0 items-center gap-2'>`,
  `      <span className='truncate'>{item.name}</span>`,
  `      <Badge variant={badge.variant} className='text-xs font-normal'>`,
  `        {badge.label}`,
  `      </Badge>`,
  `      {item.isOnline && (`,
  `        <Badge variant='outline' className='border-green-600 text-green-600 text-xs font-normal'>`,
  `          Online`,
  `        </Badge>`,
  `      )}`,
  `    </span>`,
  `  );`,
  `}`,
].join("\n");

const GENERIC_BADGE_CODE = [
  `(item) => (`,
  `  <Badge variant='secondary' className='text-xs font-normal'>{item.name}</Badge>`,
  `)`,
].join("\n");

const PLUGIN_ICON_CODE = [
  `(item) => {`,
  `  const Icon = ICONS[item.iconKey ?? "layout"];`,
  `  return <Icon className='h-4 w-4 text-muted-foreground' />;`,
  `}`,
].join("\n");

const PLUGIN_NEW_CODE = [
  `(item) => (`,
  `  <span className='flex min-w-0 items-center gap-2'>`,
  `    <span className='truncate'>{item.name}</span>`,
  `    {item.isNew && <Badge variant='secondary' className='text-xs font-normal'>New</Badge>}`,
  `  </span>`,
  `)`,
].join("\n");

const PLUGIN_TWO_LINE_CODE = [
  `(item) => (`,
  `  <span className='flex min-w-0 flex-col py-0.5'>`,
  `    <span className='truncate'>{item.name}</span>`,
  `    <span className='truncate text-xs text-muted-foreground'>{item.description}</span>`,
  `  </span>`,
  `)`,
].join("\n");

const CAR_PLATE_CODE = [
  `(item) => (`,
  `  <span className='flex min-w-0 items-center gap-2'>`,
  `    <span className='truncate'>{item.name}</span>`,
  `    <span className='shrink-0 rounded border px-1.5 font-mono text-[10px] uppercase text-muted-foreground'>`,
  `      {item.plate}`,
  `    </span>`,
  `  </span>`,
  `)`,
].join("\n");

const CITY_STATE_CODE = [
  `(item) => (`,
  `  <span className='flex min-w-0 items-center gap-2'>`,
  `    <span className='truncate'>{item.name}</span>`,
  `    <Badge variant='outline' className='text-xs font-normal'>{item.stateName}</Badge>`,
  `  </span>`,
  `)`,
].join("\n");

const CITY_CODE_CHIP_CODE = [
  `(item) => (`,
  `  <span className='shrink-0 rounded border px-1 font-mono text-[10px] text-muted-foreground'>`,
  `    {item.code}`,
  `  </span>`,
  `)`,
].join("\n");

const FOOD_EMOJI_CODE = [
  `(item) => (`,
  `  <span className='text-base leading-none'>{FOOD_EMOJI[item.kind ?? "dish"]}</span>`,
  `)`,
].join("\n");

const FOOD_SPICY_CODE = [
  `(item) => (`,
  `  <span className='flex min-w-0 items-center gap-2'>`,
  `    <span className='truncate'>{item.name}</span>`,
  `    {item.spicy && <Badge variant='destructive' className='text-xs font-normal'>Spicy 🌶️</Badge>}`,
  `  </span>`,
  `)`,
].join("\n");

const ALL_DATASETS: DatasetKey[] = ["cities", "people", "plugins", "cars", "foods"];

export const NODE_STYLES: NodeStyleSpec[] = [
  {
    key: "plain-badge",
    label: "Name in a Badge",
    datasets: ALL_DATASETS,
    kinds: ["menuLabel", "selectedLabel"],
    renderLabel: (item) => (
      <Badge variant='secondary' className='text-xs font-normal'>
        {item.name}
      </Badge>
    ),
    codeLabel: GENERIC_BADGE_CODE,
  },
  {
    key: "person-avatar",
    label: "Avatar initials",
    datasets: ["people"],
    kinds: ["menuStart", "selectedStart"],
    renderStart: (item) => (
      <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold'>
        {initials(item.name)}
      </span>
    ),
    codeStart: AVATAR_CODE,
  },
  {
    key: "person-role-badge",
    label: "Name + role Badge (± Online)",
    datasets: ["people"],
    kinds: ["menuLabel", "selectedLabel"],
    helpers: [ROLE_BADGE_HELPERS],
    renderLabel: (item) => {
      const badge = ROLE_BADGES[item.role ?? "user"];
      return (
        <span className='flex min-w-0 items-center gap-2'>
          <span className='truncate'>{item.name}</span>
          <Badge variant={badge.variant} className='text-xs font-normal'>
            {badge.label}
          </Badge>
          {item.isOnline && (
            <Badge
              variant='outline'
              className='border-green-600 text-green-600 text-xs font-normal'
            >
              Online
            </Badge>
          )}
        </span>
      );
    },
    codeLabel: ROLE_BADGE_CODE,
  },
  {
    key: "plugin-icon",
    label: "Type icon (iconMap)",
    datasets: ["plugins"],
    kinds: ["menuStart"],
    helpers: [PLUGIN_ICON_HELPERS],
    importNames: ["ChartLine", "LayoutGrid", "Sparkles"],
    renderStart: (item) => {
      const Icon =
        item.iconKey === "chart" ? ChartLine : item.iconKey === "sparkles" ? Sparkles : LayoutGrid;
      return <Icon className='h-4 w-4 text-muted-foreground' />;
    },
    codeStart: PLUGIN_ICON_CODE,
  },
  {
    key: "plugin-new-badge",
    label: "Name + conditional “New” Badge",
    datasets: ["plugins"],
    kinds: ["menuLabel", "selectedLabel"],
    renderLabel: (item) => (
      <span className='flex min-w-0 items-center gap-2'>
        <span className='truncate'>{item.name}</span>
        {item.isNew && (
          <Badge variant='secondary' className='text-xs font-normal'>
            New
          </Badge>
        )}
      </span>
    ),
    codeLabel: PLUGIN_NEW_CODE,
  },
  {
    key: "plugin-two-line",
    label: "Two lines (title + description)",
    datasets: ["plugins"],
    kinds: ["menuLabel"],
    renderLabel: (item) => (
      <span className='flex min-w-0 flex-col py-0.5'>
        <span className='truncate'>{item.name}</span>
        <span className='truncate text-xs text-muted-foreground'>{item.description}</span>
      </span>
    ),
    codeLabel: PLUGIN_TWO_LINE_CODE,
  },
  {
    key: "car-plate",
    label: "Name + plate chip",
    datasets: ["cars"],
    kinds: ["menuLabel", "selectedLabel"],
    renderLabel: (item) => (
      <span className='flex min-w-0 items-center gap-2'>
        <span className='truncate'>{item.name}</span>
        <span className='shrink-0 rounded border px-1.5 font-mono text-[10px] uppercase text-muted-foreground'>
          {item.plate}
        </span>
      </span>
    ),
    codeLabel: CAR_PLATE_CODE,
  },
  {
    key: "city-state-badge",
    label: "Name + state Badge",
    datasets: ["cities"],
    kinds: ["menuLabel", "selectedLabel"],
    renderLabel: (item) => (
      <span className='flex min-w-0 items-center gap-2'>
        <span className='truncate'>{item.name}</span>
        <Badge variant='outline' className='text-xs font-normal'>
          {item.stateName}
        </Badge>
      </span>
    ),
    codeLabel: CITY_STATE_CODE,
  },
  {
    key: "city-code-chip",
    label: "Code chip start node",
    datasets: ["cities"],
    kinds: ["menuStart"],
    renderStart: (item) => (
      <span className='shrink-0 rounded border px-1 font-mono text-[10px] text-muted-foreground'>
        {item.code}
      </span>
    ),
    codeStart: CITY_CODE_CHIP_CODE,
  },
  {
    key: "food-emoji",
    label: "Emoji by kind",
    datasets: ["foods"],
    kinds: ["menuStart"],
    helpers: [FOOD_EMOJI_HELPERS],
    renderStart: (item) => (
      <span className='text-base leading-none'>
        {item.kind === "dessert" ? "🍮" : item.kind === "drink" ? "🥤" : "🍛"}
      </span>
    ),
    codeStart: FOOD_EMOJI_CODE,
  },
  {
    key: "food-spicy",
    label: "Name + conditional “Spicy” Badge",
    datasets: ["foods"],
    kinds: ["menuLabel", "selectedLabel"],
    renderLabel: (item) => (
      <span className='flex min-w-0 items-center gap-2'>
        <span className='truncate'>{item.name}</span>
        {item.spicy && (
          <Badge variant='destructive' className='text-xs font-normal'>
            Spicy 🌶️
          </Badge>
        )}
      </span>
    ),
    codeLabel: FOOD_SPICY_CODE,
  },
];

export function getNodeStyle(key: string): NodeStyleSpec | null {
  return NODE_STYLES.find((style) => style.key === key) ?? null;
}

/** Styles valid for this dataset, filtered by the kind being configured. */
export function stylesFor(dataset: DatasetKey, kind: NodeStyleKind): NodeStyleSpec[] {
  return NODE_STYLES.filter((style) => style.datasets.includes(dataset) && style.kinds.includes(kind));
}

/** Icon styles for the tree's kind field (one-runtime Shield/Folder pattern). */
export const TREE_KIND_ICONS = {
  super: Network,
  continent: Globe,
  country: Building2,
  state: MapPinned,
  city: MapPin,
} as const;

export function renderTreeStart(item: PlaygroundRow) {
  const Icon = TREE_KIND_ICONS[(item.kind ?? "city") as keyof typeof TREE_KIND_ICONS];
  return <Icon className='h-4 w-4 text-muted-foreground' />;
}

export function indentCode(code: string, pad: string): string[] {
  return code.split("\n").map((line, index) => (index === 0 ? line : `${pad}${line}`));
}
