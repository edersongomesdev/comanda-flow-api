import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardSummary } from "@/services/api";

describe("getDashboardSummary", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("maps the minimal backend summary into the current dashboard shape", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          trialDaysLeft: 5,
          planId: "MESA",
          menuItemsCount: 18,
          tablesCount: 6,
          clicksLast7Days: 42,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    ) as typeof fetch;

    await expect(getDashboardSummary()).resolves.toEqual({
      menuViews: 42,
      menuViewsChange: 0,
      qrScans: 6,
      qrScansChange: 0,
      whatsappClicks: 0,
      whatsappClicksChange: 0,
      topItemClicks: 0,
      topItemClicksChange: 0,
      topItems: [],
      viewsByCategory: [],
      viewsByDay: [
        { day: "Seg", views: 0, clicks: 0 },
        { day: "Ter", views: 0, clicks: 0 },
        { day: "Qua", views: 0, clicks: 0 },
        { day: "Qui", views: 0, clicks: 0 },
        { day: "Sex", views: 0, clicks: 0 },
        { day: "Sáb", views: 0, clicks: 0 },
        { day: "Dom", views: 0, clicks: 0 },
      ],
    });
  });

  it("keeps analytics arrays when the backend returns them", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          clicksLast7Days: 15,
          topItems: [
            { name: "Smash", clicks: 9 },
            { name: "Batata", clicks: 4 },
          ],
          sources: [
            { source: "QR", value: 10 },
            { name: "Instagram", clicks: 5 },
          ],
          viewsByDay: [
            { day: "Seg", views: 7, clicks: 2 },
            { day: "Ter", views: 8, clicks: 3 },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    ) as typeof fetch;

    await expect(getDashboardSummary()).resolves.toEqual({
      menuViews: 15,
      menuViewsChange: 0,
      qrScans: 0,
      qrScansChange: 0,
      whatsappClicks: 0,
      whatsappClicksChange: 0,
      topItemClicks: 9,
      topItemClicksChange: 0,
      topItems: [
        { name: "Smash", clicks: 9 },
        { name: "Batata", clicks: 4 },
      ],
      viewsByCategory: [
        { name: "QR", value: 10 },
        { name: "Instagram", value: 5 },
      ],
      viewsByDay: [
        { day: "Seg", views: 7, clicks: 2 },
        { day: "Ter", views: 8, clicks: 3 },
      ],
    });
  });
});
