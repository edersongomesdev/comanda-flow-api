import type { Tenant, User, Category, MenuItem, Table, PipelineLead, Plan, DashboardSummary } from "@/types";

export const mockTenant: Tenant = {
  id: "t1",
  name: "General Burguer",
  slug: "general-burguer",
  logo: "",
  phone: "(11) 99999-8888",
  whatsapp: "(11) 99999-8888",
  address: "Rua das Hamburguerias, 42 - São Paulo, SP",
  plan: "MESA",
  trialDaysLeft: 5,
  onboardingProgress: 60,
  onboardingSteps: [
    { id: "s1", label: "Cadastro", completed: true },
    { id: "s2", label: "Cardápio", completed: true },
    { id: "s3", label: "WhatsApp", completed: true },
    { id: "s4", label: "Mesas", completed: false },
    { id: "s5", label: "Plano", completed: false },
  ],
  deliveryNeighborhoods: ["Centro", "Jardins", "Vila Madalena", "Pinheiros", "Moema"],
  paymentMethods: ["Pix", "Cartão Crédito", "Cartão Débito", "Dinheiro"],
  operatingHours: [
    { day: "Segunda", open: "11:00", close: "23:00", active: true },
    { day: "Terça", open: "11:00", close: "23:00", active: true },
    { day: "Quarta", open: "11:00", close: "23:00", active: true },
    { day: "Quinta", open: "11:00", close: "23:00", active: true },
    { day: "Sexta", open: "11:00", close: "00:00", active: true },
    { day: "Sábado", open: "11:00", close: "00:00", active: true },
    { day: "Domingo", open: "12:00", close: "22:00", active: true },
  ],
};

export const mockUser: User = {
  id: "u1",
  name: "Carlos Silva",
  email: "carlos@generalburguer.com",
  role: "owner",
  tenantId: "t1",
};

export const mockCategories: Category[] = [
  { id: "c1", name: "Burgers", order: 1 },
  { id: "c2", name: "Acompanhamentos", order: 2 },
  { id: "c3", name: "Bebidas", order: 3 },
  { id: "c4", name: "Sobremesas", order: 4 },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: "m1", name: "Smash Clássico", description: "Dois smash burgers 90g, queijo cheddar, cebola caramelizada, picles e molho especial.", price: 32.9,
    categoryId: "c1", bestSeller: true, available: true,
    modifierGroups: [
      { id: "mg1", name: "Ponto da Carne", required: true, min: 1, max: 1, modifiers: [
        { id: "mod1", name: "Mal passado", price: 0 }, { id: "mod2", name: "Ao ponto", price: 0 }, { id: "mod3", name: "Bem passado", price: 0 },
      ]},
      { id: "mg2", name: "Adicionais", required: false, min: 0, max: 3, modifiers: [
        { id: "mod4", name: "Bacon +", price: 5 }, { id: "mod5", name: "Ovo +", price: 4 }, { id: "mod6", name: "Cheddar extra", price: 4 },
      ]},
    ],
  },
  {
    id: "m2", name: "General Burguer", description: "Hambúrguer artesanal 180g, queijo provolone, rúcula, tomate seco e maionese trufada.", price: 39.9,
    categoryId: "c1", bestSeller: true, available: true, modifierGroups: [
      { id: "mg3", name: "Ponto da Carne", required: true, min: 1, max: 1, modifiers: [
        { id: "mod7", name: "Mal passado", price: 0 }, { id: "mod8", name: "Ao ponto", price: 0 }, { id: "mod9", name: "Bem passado", price: 0 },
      ]},
    ],
  },
  {
    id: "m3", name: "Chicken Crunch", description: "Frango empanado crocante, alface, tomate e maionese de alho.", price: 28.9,
    categoryId: "c1", bestSeller: false, available: true, modifierGroups: [],
  },
  {
    id: "m4", name: "Veggie Flow", description: "Hambúrguer de grão de bico, queijo coalho, rúcula e molho tahine.", price: 34.9,
    categoryId: "c1", bestSeller: false, available: true, modifierGroups: [],
  },
  {
    id: "m5", name: "Batata Rústica", description: "Batatas rústicas com casca, temperadas com alecrim e flor de sal.", price: 18.9,
    categoryId: "c2", bestSeller: true, available: true, modifierGroups: [],
  },
  {
    id: "m6", name: "Onion Rings", description: "Anéis de cebola empanados e crocantes com molho barbecue.", price: 16.9,
    categoryId: "c2", bestSeller: false, available: true, modifierGroups: [],
  },
  {
    id: "m7", name: "Coca-Cola", description: "Lata 350ml", price: 7.9, categoryId: "c3", bestSeller: false, available: true, modifierGroups: [],
  },
  {
    id: "m8", name: "Suco Natural", description: "Laranja, limão ou maracujá. 400ml", price: 12.9,
    categoryId: "c3", bestSeller: false, available: true,
    modifierGroups: [
      { id: "mg4", name: "Sabor", required: true, min: 1, max: 1, modifiers: [
        { id: "mod10", name: "Laranja", price: 0 }, { id: "mod11", name: "Limão", price: 0 }, { id: "mod12", name: "Maracujá", price: 0 },
      ]},
    ],
  },
  {
    id: "m9", name: "Brownie com Sorvete", description: "Brownie de chocolate belga com sorvete de creme e calda quente.", price: 22.9,
    categoryId: "c4", bestSeller: true, available: true, modifierGroups: [],
  },
];

export const mockTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
  id: `tb${i + 1}`,
  number: i + 1,
  qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://app.comandaflow.com/m/general-burguer/menu/${i + 1}`,
  status: i < 4 ? "occupied" as const : "free" as const,
  clicks: Math.floor(Math.random() * 80) + 10,
  link: `/m/general-burguer/menu/${i + 1}`,
}));

export const mockLeads: PipelineLead[] = [
  { id: "l1", name: "João Restaurante", phone: "(11) 91111-2222", source: "Instagram", stage: "new", value: 150, createdAt: "2026-02-14" },
  { id: "l2", name: "Maria Pizzaria", phone: "(11) 93333-4444", source: "WhatsApp", stage: "contacted", value: 200, createdAt: "2026-02-13" },
  { id: "l3", name: "Pedro Lanchonete", phone: "(11) 95555-6666", source: "Indicação", stage: "negotiating", value: 300, createdAt: "2026-02-10" },
  { id: "l4", name: "Ana Hamburgueria", phone: "(11) 97777-8888", source: "Google", stage: "closed", value: 250, createdAt: "2026-02-08" },
  { id: "l5", name: "Lucas Cafeteria", phone: "(11) 92222-3333", source: "Instagram", stage: "new", value: 180, createdAt: "2026-02-15" },
];

export const mockPlans: Plan[] = [
  { id: "START", name: "Start", price: 0, description: "Para quem está começando", maxTables: 0, maxItems: 15, whatsapp: false, pipeline: false, features: [
    "Cardápio digital", "Até 15 itens", "Link público", "Suporte por email",
  ]},
  { id: "ESSENCIAL", name: "Essencial", price: 49.9, description: "Para crescer com consistência", maxTables: 0, maxItems: 50, whatsapp: true, pipeline: false, features: [
    "Tudo do Start", "Até 50 itens", "Kit WhatsApp", "Categorias ilimitadas", "Relatórios básicos",
  ]},
  { id: "MESA", name: "Mesa", price: 89.9, description: "Para quem atende no salão", maxTables: 15, maxItems: 100, whatsapp: true, pipeline: false, popular: true, features: [
    "Tudo do Essencial", "Até 15 mesas QR", "Até 100 itens", "Dashboard analítico", "Suporte prioritário",
  ]},
  { id: "PREMIUM", name: "Premium", price: 149.9, description: "Gestão completa do negócio", maxTables: 999, maxItems: 999, whatsapp: true, pipeline: true, features: [
    "Tudo do Mesa", "Mesas ilimitadas", "Itens ilimitados", "Pipeline de vendas", "Relatórios avançados", "API acesso",
  ]},
];

export const mockDashboard: DashboardSummary = {
  menuViews: 1247, menuViewsChange: 12.5,
  qrScans: 342, qrScansChange: 8.3,
  whatsappClicks: 89, whatsappClicksChange: -2.1,
  topItemClicks: 156, topItemClicksChange: 15.7,
  topItems: [
    { name: "Smash Clássico", clicks: 156 },
    { name: "General Burguer", clicks: 134 },
    { name: "Batata Rústica", clicks: 98 },
    { name: "Brownie com Sorvete", clicks: 87 },
    { name: "Chicken Crunch", clicks: 65 },
  ],
  viewsByCategory: [
    { name: "Burgers", value: 580 },
    { name: "Acompanhamentos", value: 230 },
    { name: "Bebidas", value: 190 },
    { name: "Sobremesas", value: 150 },
  ],
  viewsByDay: [
    { day: "Seg", views: 120, clicks: 34 },
    { day: "Ter", views: 145, clicks: 42 },
    { day: "Qua", views: 160, clicks: 48 },
    { day: "Qui", views: 190, clicks: 55 },
    { day: "Sex", views: 240, clicks: 72 },
    { day: "Sáb", views: 280, clicks: 85 },
    { day: "Dom", views: 112, clicks: 30 },
  ],
};
