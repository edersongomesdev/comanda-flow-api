import { mockLeads, mockPlans, mockTenant } from "@/data/mock";
import { HttpError, http } from "@/services/http";
import type {
  Category,
  DashboardSummary,
  MenuItem,
  Modifier,
  PlanId,
  PipelineLead,
  Plan,
  PublicMenuData,
  Table,
  Tenant,
  User,
} from "@/types";

export interface AuthSession {
  accessToken: string;
  user: User;
}

interface BackendAuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role?: "OWNER" | "ADMIN";
}

interface BackendAuthResponse {
  accessToken: string;
  user: BackendAuthUser;
}

interface BackendTenantFeatures {
  tables: boolean;
  pipeline: boolean;
  whatsappKit: boolean;
}

interface BackendTenantLimits {
  maxTables: number;
}

interface BackendTenant {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  logoUrl: string | null;
  planId: BackendPlanId;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  maxTables: number;
  deliveryAreas: string[];
  paymentMethods: string[];
  features: BackendTenantFeatures;
  limits: BackendTenantLimits;
}

interface BackendPublicCategory {
  id: string;
  name: string;
  sortOrder: number;
}

interface BackendPublicModifier {
  id: string;
  name: string;
  priceCents: number;
  sortOrder: number;
  isActive?: boolean;
}

interface BackendPublicModifierGroup {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  min: number;
  max: number;
  sortOrder: number;
  modifiers: BackendPublicModifier[];
}

interface BackendPublicMenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modifierGroups: BackendPublicModifierGroup[];
}

interface BackendPublicMenuResponse {
  tenant: BackendTenant;
  categories: BackendPublicCategory[];
  items: BackendPublicMenuItem[];
}

interface BackendTableResponse {
  id: string;
  number: number;
  status?: string;
  clicks?: number;
  qrCode?: string;
  link?: string;
}

interface BackendDashboardTopItem {
  name?: string | null;
  clicks?: number | null;
}

interface BackendDashboardSource {
  name?: string | null;
  source?: string | null;
  value?: number | null;
  clicks?: number | null;
}

interface BackendDashboardViewsByDay {
  day?: string | null;
  views?: number | null;
  clicks?: number | null;
}

interface BackendDashboardSummary {
  trialDaysLeft?: number | null;
  planId?: BackendPlanId | null;
  menuItemsCount?: number | null;
  tablesCount?: number | null;
  clicksLast7Days?: number | null;
  topItems?: BackendDashboardTopItem[] | null;
  sources?: BackendDashboardSource[] | null;
  viewsByCategory?: BackendDashboardSource[] | null;
  viewsByDay?: BackendDashboardViewsByDay[] | null;
  menuViews?: number | null;
  menuViewsChange?: number | null;
  qrScans?: number | null;
  qrScansChange?: number | null;
  whatsappClicks?: number | null;
  whatsappClicksChange?: number | null;
  topItemClicks?: number | null;
  topItemClicksChange?: number | null;
}

type OperatingHour = Tenant["operatingHours"][number];
type FrontendMenuModifierWithMeta = Modifier & {
  sortOrder?: number;
  isActive?: boolean;
};
type FrontendMenuModifierGroupWithMeta = MenuItem["modifierGroups"][number] & {
  description?: string;
  sortOrder?: number;
  modifiers: FrontendMenuModifierWithMeta[];
};
type FrontendMenuItemCreateInput = Omit<MenuItem, "id"> & {
  modifierGroups: FrontendMenuModifierGroupWithMeta[];
};
type FrontendMenuItemUpdateInput = Partial<MenuItem> & {
  modifierGroups?: FrontendMenuModifierGroupWithMeta[];
};

interface BackendMenuItemModifierPayload {
  id?: string;
  name: string;
  priceCents?: number;
  sortOrder?: number;
  isActive?: boolean;
}

interface BackendMenuItemModifierGroupPayload {
  id?: string;
  name: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  sortOrder?: number;
  modifiers: BackendMenuItemModifierPayload[];
}

interface BackendCreateMenuItemPayload {
  name: string;
  description?: string;
  priceCents: number;
  categoryId: string;
  imageUrl?: string;
  isBestSeller?: boolean;
  isActive?: boolean;
  modifierGroups?: Omit<BackendMenuItemModifierGroupPayload, "id">[];
}

type BackendUpdateMenuItemPayload = Partial<
  Omit<BackendCreateMenuItemPayload, "modifierGroups">
> & {
  modifierGroups?: BackendMenuItemModifierGroupPayload[];
};

type TenantUpdateInput = Partial<Tenant> &
  Partial<Pick<BackendTenant, "city" | "hours" | "logoUrl" | "deliveryAreas">>;

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
const DAY_INDEX_BY_ALIAS = new Map<string, number>([
  ["seg", 0],
  ["segunda", 0],
  ["ter", 1],
  ["terca", 1],
  ["terça", 1],
  ["qua", 2],
  ["quarta", 2],
  ["qui", 3],
  ["quinta", 3],
  ["sex", 4],
  ["sexta", 4],
  ["sab", 5],
  ["sabado", 5],
  ["sábado", 5],
  ["dom", 6],
  ["domingo", 6],
]);
let cachedTenantSlug = "";
const DASHBOARD_DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
type BackendPlanId = PlanId;

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));

function createEmptyOperatingHours(): OperatingHour[] {
  return DAY_NAMES.map((day) => ({ day, open: "", close: "", active: false }));
}

function cloneOnboardingSteps(): Tenant["onboardingSteps"] {
  return mockTenant.onboardingSteps.map((step) => ({ ...step }));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .trim();
}

function resolveDayIndex(value: string) {
  const normalized = normalizeText(value);

  for (const [alias, index] of DAY_INDEX_BY_ALIAS.entries()) {
    if (normalized === alias || normalized.startsWith(alias)) {
      return index;
    }
  }

  return undefined;
}

function resolveDayRange(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes("todos os dias") ||
    normalized.includes("todo dia") ||
    normalized.includes("diario") ||
    normalized.includes("diariamente")
  ) {
    return new Set(DAY_NAMES.map((_, index) => index));
  }

  const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 1) {
    const index = resolveDayIndex(parts[0]);
    return index === undefined ? null : new Set([index]);
  }

  if (parts.length !== 2) {
    return null;
  }

  const start = resolveDayIndex(parts[0]);
  const end = resolveDayIndex(parts[1]);

  if (start === undefined || end === undefined) {
    return null;
  }

  const indexes = new Set<number>();

  if (start <= end) {
    for (let index = start; index <= end; index += 1) {
      indexes.add(index);
    }
  } else {
    for (let index = start; index < DAY_NAMES.length; index += 1) {
      indexes.add(index);
    }

    for (let index = 0; index <= end; index += 1) {
      indexes.add(index);
    }
  }

  return indexes;
}

function formatTime(hour: string, minute = "00") {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function parseTimeRange(value: string) {
  const match = value.match(/(\d{1,2})(?::?(\d{2}))?\s*h?\s*-\s*(\d{1,2})(?::?(\d{2}))?\s*h?/i);

  if (!match) {
    return null;
  }

  return {
    open: formatTime(match[1], match[2] ?? "00"),
    close: formatTime(match[3], match[4] ?? "00"),
  };
}

function isOperatingHour(value: unknown): value is OperatingHour {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as OperatingHour).day === "string" &&
      typeof (value as OperatingHour).open === "string" &&
      typeof (value as OperatingHour).close === "string" &&
      typeof (value as OperatingHour).active === "boolean",
  );
}

function parseOperatingHours(hours: string | null | undefined): OperatingHour[] {
  if (!hours) {
    return createEmptyOperatingHours();
  }

  try {
    const parsed = JSON.parse(hours) as unknown;

    if (Array.isArray(parsed) && parsed.every(isOperatingHour)) {
      return parsed.map((entry) => ({ ...entry }));
    }
  } catch {
    // Ignore JSON parsing errors and try the legacy single-string format.
  }

  const timeRange = parseTimeRange(hours);

  if (!timeRange) {
    return createEmptyOperatingHours();
  }

  const dayRangeLabel = hours.slice(0, hours.search(/\d/)).trim();
  const dayIndexes = resolveDayRange(dayRangeLabel);

  if (!dayIndexes) {
    return createEmptyOperatingHours().map((entry) => ({
      ...entry,
      open: timeRange.open,
      close: timeRange.close,
      active: true,
    }));
  }

  return DAY_NAMES.map((day, index) => ({
    day,
    open: dayIndexes.has(index) ? timeRange.open : "",
    close: dayIndexes.has(index) ? timeRange.close : "",
    active: dayIndexes.has(index),
  }));
}

function serializeOperatingHours(operatingHours: OperatingHour[] | undefined) {
  return JSON.stringify((operatingHours ?? createEmptyOperatingHours()).map((entry) => ({ ...entry })));
}

function mapBackendPlanToFrontend(tenant: Pick<BackendTenant, "planId" | "features">): Tenant["plan"] {
  switch (tenant.planId) {
    case "START":
    case "ESSENCIAL":
    case "MESA":
    case "PREMIUM":
      return tenant.planId;
    default:
      if (tenant.features.pipeline) {
        return "PREMIUM";
      }

      if (tenant.features.tables) {
        return "MESA";
      }

      if (tenant.features.whatsappKit) {
        return "ESSENCIAL";
      }

      return "START";
  }
}

function mapBackendTenantToFrontend(tenant: BackendTenant): Tenant {
  cachedTenantSlug = tenant.slug;

  const deliveryAreas = tenant.deliveryAreas ?? [];
  const paymentMethods = tenant.paymentMethods ?? [];
  const operatingHours = parseOperatingHours(tenant.hours);

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logo: tenant.logoUrl ?? "",
    phone: tenant.phone ?? "",
    whatsapp: tenant.whatsapp ?? "",
    address: tenant.address ?? "",
    plan: mapBackendPlanToFrontend(tenant),
    trialDaysLeft: tenant.trialDaysLeft ?? 0,
    onboardingProgress: mockTenant.onboardingProgress,
    onboardingSteps: cloneOnboardingSteps(),
    deliveryNeighborhoods: [...deliveryAreas],
    paymentMethods: [...paymentMethods],
    operatingHours,
    city: tenant.city ?? "",
    hours: tenant.hours ?? serializeOperatingHours(operatingHours),
    logoUrl: tenant.logoUrl ?? "",
    planId: tenant.planId,
    trialEndsAt: tenant.trialEndsAt,
    maxTables: tenant.maxTables,
    deliveryAreas: [...deliveryAreas],
    features: { ...tenant.features },
    limits: { ...tenant.limits },
  } as Tenant;
}

function mapFrontendTenantUpdateToBackend(data: TenantUpdateInput) {
  const payload: Partial<
    Pick<
      BackendTenant,
      "name" | "slug" | "address" | "city" | "phone" | "whatsapp" | "hours" | "logoUrl" | "deliveryAreas" | "paymentMethods"
    >
  > = {};

  if ("name" in data) {
    payload.name = data.name;
  }

  if ("slug" in data) {
    payload.slug = data.slug;
  }

  if ("address" in data) {
    payload.address = data.address;
  }

  if ("city" in data) {
    payload.city = data.city;
  }

  if ("phone" in data) {
    payload.phone = data.phone;
  }

  if ("whatsapp" in data) {
    payload.whatsapp = data.whatsapp;
  }

  if ("operatingHours" in data) {
    payload.hours = serializeOperatingHours(data.operatingHours);
  }

  if ("hours" in data && data.hours !== undefined) {
    payload.hours = data.hours;
  }

  if ("logo" in data) {
    payload.logoUrl = data.logo ?? "";
  }

  if ("logoUrl" in data && data.logoUrl !== undefined) {
    payload.logoUrl = data.logoUrl ?? "";
  }

  if ("deliveryNeighborhoods" in data) {
    payload.deliveryAreas = [...(data.deliveryNeighborhoods ?? [])];
  }

  if ("deliveryAreas" in data && data.deliveryAreas !== undefined) {
    payload.deliveryAreas = [...(data.deliveryAreas ?? [])];
  }

  if ("paymentMethods" in data) {
    payload.paymentMethods = [...(data.paymentMethods ?? [])];
  }

  return payload;
}

function mapBackendPublicCategoryToFrontend(category: BackendPublicCategory, index: number): Category {
  return {
    id: category.id,
    name: category.name,
    order: typeof category.sortOrder === "number" ? category.sortOrder : index,
  };
}

function mapBackendPublicModifierToFrontend(modifier: BackendPublicModifier): Modifier {
  return {
    id: modifier.id,
    name: modifier.name,
    price: modifier.priceCents / 100,
    sortOrder: modifier.sortOrder,
    isActive: modifier.isActive ?? true,
  } as Modifier;
}

function mapBackendPublicMenuItemToFrontend(item: BackendPublicMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: item.priceCents / 100,
    image: item.imageUrl ?? undefined,
    categoryId: item.categoryId,
    bestSeller: item.isBestSeller,
    available: item.isActive,
    modifierGroups: [...item.modifierGroups]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
        required: group.required,
        min: group.min,
        max: group.max,
        sortOrder: group.sortOrder,
        modifiers: [...group.modifiers]
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map(mapBackendPublicModifierToFrontend),
      })),
  } as MenuItem;
}

function toPriceCents(value: number) {
  return Math.round(value * 100);
}

function mapFrontendModifierToBackend(
  modifier: FrontendMenuModifierWithMeta,
  index: number,
  options: { includeIds: boolean },
): BackendMenuItemModifierPayload {
  const payload: BackendMenuItemModifierPayload = {
    name: modifier.name,
    priceCents: toPriceCents(modifier.price ?? 0),
    sortOrder: typeof modifier.sortOrder === "number" ? modifier.sortOrder : index,
    isActive: modifier.isActive ?? true,
  };

  if (options.includeIds && modifier.id) {
    payload.id = modifier.id;
  }

  return payload;
}

function mapFrontendModifierGroupToBackend(
  group: FrontendMenuModifierGroupWithMeta,
  index: number,
  options: { includeIds: boolean },
) {
  const payload: BackendMenuItemModifierGroupPayload = {
    name: group.name,
    description: group.description ?? undefined,
    required: group.required,
    min: group.min,
    max: group.max,
    sortOrder: typeof group.sortOrder === "number" ? group.sortOrder : index,
    modifiers: group.modifiers.map((modifier, modifierIndex) =>
      mapFrontendModifierToBackend(modifier, modifierIndex, options),
    ),
  };

  if (options.includeIds && group.id) {
    payload.id = group.id;
  }

  return payload;
}

function mapFrontendMenuItemToBackendCreate(item: FrontendMenuItemCreateInput): BackendCreateMenuItemPayload {
  const payload: BackendCreateMenuItemPayload = {
    name: item.name,
    description: item.description,
    priceCents: toPriceCents(item.price),
    categoryId: item.categoryId,
    imageUrl: item.image || undefined,
    isBestSeller: item.bestSeller,
    isActive: item.available,
  };

  if (item.modifierGroups.length > 0) {
    payload.modifierGroups = item.modifierGroups.map((group, index) =>
      mapFrontendModifierGroupToBackend(group, index, { includeIds: false }),
    );
  }

  return payload;
}

function mapFrontendMenuItemToBackendUpdate(data: FrontendMenuItemUpdateInput): BackendUpdateMenuItemPayload {
  const payload: BackendUpdateMenuItemPayload = {};

  if ("name" in data) {
    payload.name = data.name;
  }

  if ("description" in data) {
    payload.description = data.description;
  }

  if ("price" in data && data.price !== undefined) {
    payload.priceCents = toPriceCents(data.price);
  }

  if ("categoryId" in data) {
    payload.categoryId = data.categoryId;
  }

  if ("image" in data && data.image) {
    payload.imageUrl = data.image;
  }

  if ("bestSeller" in data) {
    payload.isBestSeller = data.bestSeller;
  }

  if ("available" in data) {
    payload.isActive = data.available;
  }

  if ("modifierGroups" in data) {
    payload.modifierGroups = (data.modifierGroups ?? []).map((group, index) =>
      mapFrontendModifierGroupToBackend(group, index, { includeIds: true }),
    );
  }

  return payload;
}

async function resolveTenantSlug() {
  if (cachedTenantSlug) {
    return cachedTenantSlug;
  }

  const tenant = await http.get<BackendTenant>("/tenants/me");
  cachedTenantSlug = tenant.slug;
  return cachedTenantSlug;
}

function buildTableLink(slug: string, number: number) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:4173";

  return `${origin}/m/${slug}/menu/${number}`;
}

function buildTableQrCode(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}

function mapBackendTableStatusToFrontend(status: string | undefined): Table["status"] {
  return status === "OCCUPIED" || status === "occupied" ? "occupied" : "free";
}

function mapBackendTableToFrontend(table: BackendTableResponse, tenantSlug: string): Table {
  const link = table.link ?? buildTableLink(tenantSlug, table.number);

  return {
    id: table.id,
    number: table.number,
    qrCode: table.qrCode ?? buildTableQrCode(link),
    status: mapBackendTableStatusToFrontend(table.status),
    clicks: typeof table.clicks === "number" ? table.clicks : 0,
    link,
  };
}

function toSafeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getFirstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function createEmptyViewsByDay(): DashboardSummary["viewsByDay"] {
  return DASHBOARD_DAY_LABELS.map((day) => ({
    day,
    views: 0,
    clicks: 0,
  }));
}

function mapDashboardTopItems(items: BackendDashboardTopItem[] | null | undefined): DashboardSummary["topItems"] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    const name = getFirstNonEmptyString(item.name);

    if (!name) {
      return [];
    }

    return [{ name, clicks: toSafeNumber(item.clicks) }];
  });
}

function mapDashboardCategoryValues(
  entries: BackendDashboardSource[] | null | undefined,
): DashboardSummary["viewsByCategory"] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.flatMap((entry) => {
    const name = getFirstNonEmptyString(entry.name, entry.source);

    if (!name) {
      return [];
    }

    return [{ name, value: toSafeNumber(entry.value, toSafeNumber(entry.clicks)) }];
  });
}

function mapDashboardViewsByDay(
  entries: BackendDashboardViewsByDay[] | null | undefined,
): DashboardSummary["viewsByDay"] {
  if (!Array.isArray(entries) || entries.length === 0) {
    return createEmptyViewsByDay();
  }

  return entries.map((entry, index) => ({
    day: getFirstNonEmptyString(entry.day) ?? DASHBOARD_DAY_LABELS[index] ?? `Dia ${index + 1}`,
    views: toSafeNumber(entry.views),
    clicks: toSafeNumber(entry.clicks),
  }));
}

function mapBackendDashboardSummaryToFrontend(summary: BackendDashboardSummary): DashboardSummary {
  const topItems = mapDashboardTopItems(summary.topItems);
  const viewsByCategory =
    mapDashboardCategoryValues(summary.viewsByCategory).length > 0
      ? mapDashboardCategoryValues(summary.viewsByCategory)
      : mapDashboardCategoryValues(summary.sources);

  return {
    menuViews: toSafeNumber(summary.menuViews, toSafeNumber(summary.clicksLast7Days)),
    menuViewsChange: toSafeNumber(summary.menuViewsChange),
    qrScans: toSafeNumber(summary.qrScans, toSafeNumber(summary.tablesCount)),
    qrScansChange: toSafeNumber(summary.qrScansChange),
    whatsappClicks: toSafeNumber(summary.whatsappClicks),
    whatsappClicksChange: toSafeNumber(summary.whatsappClicksChange),
    topItemClicks: toSafeNumber(summary.topItemClicks, topItems[0]?.clicks ?? 0),
    topItemClicksChange: toSafeNumber(summary.topItemClicksChange),
    topItems,
    viewsByCategory,
    viewsByDay: mapDashboardViewsByDay(summary.viewsByDay),
  };
}

function mapBackendUserToFrontend(user: BackendAuthUser): User {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "manager" : "owner",
  };
}

// Tenant
export async function getTenant(): Promise<Tenant> {
  const response = await http.get<BackendTenant>("/tenants/me");
  return mapBackendTenantToFrontend(response);
}

export async function updateTenant(data: TenantUpdateInput): Promise<Tenant> {
  const response = await http.patch<BackendTenant>("/tenants/me", mapFrontendTenantUpdateToBackend(data));
  return mapBackendTenantToFrontend(response);
}

// Auth
export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await http.post<BackendAuthResponse>("/auth/login", { email, password });

  return {
    accessToken: response.accessToken,
    user: mapBackendUserToFrontend(response.user),
  };
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  planId: PlanId;
}): Promise<AuthSession> {
  const response = await http.post<BackendAuthResponse>("/auth/register", data);

  return {
    accessToken: response.accessToken,
    user: mapBackendUserToFrontend(response.user),
  };
}

export async function getCurrentUser(): Promise<User> {
  const response = await http.get<BackendAuthUser>("/auth/me");
  return mapBackendUserToFrontend(response);
}

export async function getPublicMenu(slug: string): Promise<PublicMenuData> {
  try {
    const response = await http.get<BackendPublicMenuResponse>(`/public/${encodeURIComponent(slug)}/menu`);

    return {
      tenant: mapBackendTenantToFrontend(response.tenant),
      categories: response.categories.map(mapBackendPublicCategoryToFrontend),
      items: response.items.map(mapBackendPublicMenuItemToFrontend),
    };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      throw new Error("Cardápio não encontrado.");
    }

    throw new Error("Não foi possível carregar o cardápio.");
  }
}

// Menu
export async function getCategories(): Promise<Category[]> {
  const response = await http.get<BackendPublicCategory[]>("/categories");
  return response.map(mapBackendPublicCategoryToFrontend);
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const response = await http.get<BackendPublicMenuItem[]>("/menu-items");
  return response.map(mapBackendPublicMenuItemToFrontend);
}

export async function createMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem> {
  const response = await http.post<BackendPublicMenuItem>("/menu-items", mapFrontendMenuItemToBackendCreate(item));
  return mapBackendPublicMenuItemToFrontend(response);
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
  const response = await http.patch<BackendPublicMenuItem>(
    `/menu-items/${encodeURIComponent(id)}`,
    mapFrontendMenuItemToBackendUpdate(data),
  );
  return mapBackendPublicMenuItemToFrontend(response);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await http.delete<void>(`/menu-items/${encodeURIComponent(id)}`);
}

// Tables
export async function getTables(): Promise<Table[]> {
  const response = await http.get<BackendTableResponse[]>("/tables");
  const tenantSlug = response.some((table) => !table.link)
    ? await resolveTenantSlug()
    : cachedTenantSlug;

  return response.map((table) => mapBackendTableToFrontend(table, tenantSlug));
}

export async function createTable(number: number): Promise<Table> {
  const response = await http.post<BackendTableResponse>("/tables", { number });
  const tenantSlug = response.link ? cachedTenantSlug : await resolveTenantSlug();
  return mapBackendTableToFrontend(response, tenantSlug);
}

export async function deleteTable(id: string): Promise<void> {
  await http.delete<void>(`/tables/${encodeURIComponent(id)}`);
}

// Pipeline
export async function getPipelineLeads(): Promise<PipelineLead[]> {
  await delay();
  return [...mockLeads];
}

export async function updateLeadStage(id: string, stage: PipelineLead["stage"]): Promise<PipelineLead> {
  await delay(300);
  const lead = mockLeads.find((item) => item.id === id);
  return { ...lead!, stage };
}

// Plans
export async function getPlans(): Promise<Plan[]> {
  await delay(200);
  return [...mockPlans];
}

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await http.get<BackendDashboardSummary>("/dashboard/summary");
  return mapBackendDashboardSummaryToFrontend(response);
}
