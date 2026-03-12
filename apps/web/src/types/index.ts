export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  address: string;
  plan: PlanId;
  trialDaysLeft: number;
  onboardingProgress: number;
  onboardingSteps: OnboardingStep[];
  deliveryNeighborhoods: string[];
  paymentMethods: string[];
  operatingHours: { day: string; open: string; close: string; active: boolean }[];
}

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  tenantId: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  categoryId: string;
  bestSeller: boolean;
  available: boolean;
  modifierGroups: ModifierGroup[];
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
  status: "free" | "occupied";
  clicks: number;
  link: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: Modifier[];
  notes: string;
}

export interface PipelineLead {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: "new" | "contacted" | "negotiating" | "closed";
  value: number;
  createdAt: string;
}

export type PlanId = "START" | "ESSENCIAL" | "MESA" | "PREMIUM";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  maxTables: number;
  maxItems: number;
  whatsapp: boolean;
  pipeline: boolean;
}

export interface Subscription {
  planId: PlanId;
  status: "trial" | "active" | "canceled";
  trialEndsAt: string;
}

export interface DashboardSummary {
  menuViews: number;
  menuViewsChange: number;
  qrScans: number;
  qrScansChange: number;
  whatsappClicks: number;
  whatsappClicksChange: number;
  topItemClicks: number;
  topItemClicksChange: number;
  topItems: { name: string; clicks: number }[];
  viewsByCategory: { name: string; value: number }[];
  viewsByDay: { day: string; views: number; clicks: number }[];
}

export interface PublicMenuData {
  tenant: Tenant;
  categories: Category[];
  items: MenuItem[];
}
