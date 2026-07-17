import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Brain,
  Factory,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Layers,
  LineChart,
  Puzzle,
  Rocket,
  Settings,
  Share2,
  Sparkles,
  Workflow,
  Dna,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
};

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/enterprise", label: "Enterprise", icon: Briefcase, group: "main" },
  { href: "/projects", label: "Projects", icon: FolderKanban, group: "main" },
  { href: "/factory", label: "Factory", icon: Factory, group: "factory" },
  { href: "/intelligence", label: "Intelligence", icon: Brain, group: "factory" },
  { href: "/dna", label: "DNA", icon: Dna, group: "factory" },
  { href: "/modules", label: "Modules", icon: Puzzle, group: "factory" },
  { href: "/blueprints", label: "Blueprints", icon: Layers, group: "factory" },
  { href: "/builders", label: "Builders", icon: Workflow, group: "factory" },
  { href: "/integrations", label: "Integrations", icon: GitBranch, group: "ops" },
  { href: "/deployments", label: "Deployments", icon: Rocket, group: "ops" },
  { href: "/analytics", label: "Analytics", icon: LineChart, group: "ops" },
  { href: "/social", label: "Social", icon: Share2, group: "growth" },
  { href: "/automation", label: "Automation", icon: Sparkles, group: "growth" },
  { href: "/settings", label: "Settings", icon: Settings, group: "system" },
];

export const ACTIVITY_FEED = [
  { id: "1", kind: "build", text: "Booking reference regenerated", t: "2m" },
  { id: "2", kind: "dna", text: "DNA confidence gate passed (92%)", t: "8m" },
  { id: "3", kind: "deploy", text: "Integration plan → Vercel URL ready", t: "14m" },
  { id: "4", kind: "module", text: "Module reuse 100% on saas assembly", t: "21m" },
  { id: "5", kind: "enterprise", text: "Enterprise scaffold live · dogfood phase next", t: "1h" },
  { id: "6", kind: "core", text: "Grabber Core health: frozen · healthy", t: "1h" },
];
