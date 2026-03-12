interface ModifierOptionInput {
  id: string;
  name: string;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
}

interface ModifierGroupInput {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: ModifierOptionInput[];
}

interface MenuItemModifierGroupLinkInput {
  sortOrder: number;
  modifierGroup: ModifierGroupInput;
}

interface MenuItemPresenterInput {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  modifierGroupLinks: MenuItemModifierGroupLinkInput[];
}

export function presentMenuItem(
  item: MenuItemPresenterInput,
  options?: { publicView?: boolean },
) {
  const publicView = options?.publicView ?? false;

  return {
    id: item.id,
    tenantId: item.tenantId,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    isBestSeller: item.isBestSeller,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    modifierGroups: item.modifierGroupLinks
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((link) => ({
        id: link.modifierGroup.id,
        name: link.modifierGroup.name,
        description: link.modifierGroup.description,
        required: link.modifierGroup.isRequired,
        min: link.modifierGroup.minSelections,
        max: link.modifierGroup.maxSelections,
        sortOrder: link.modifierGroup.sortOrder,
        modifiers: link.modifierGroup.options
          .filter((option) => (publicView ? option.isActive : true))
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceCents: option.priceCents,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
          })),
      }))
      .filter((group) => group.modifiers.length > 0),
  };
}
