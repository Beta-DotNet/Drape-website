"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PromotionRecord = {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  priority: number;
};

type DealRecord = {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  badge_text?: string | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  priority: number;
};

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("sb_secret_");

const emptyPromotionForm = {
  title: "",
  description: "",
  image_url: "",
  link_url: "/shop",
  cta_text: "Shop now",
  is_active: true,
  start_date: "",
  end_date: "",
  priority: 0,
};

const emptyDealForm = {
  title: "",
  description: "",
  image_url: "",
  link_url: "/shop",
  badge_text: "Deal",
  is_active: true,
  start_date: "",
  end_date: "",
  priority: 0,
};

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 16);
}

async function adminApiRequest(endpoint: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return payload?.data;
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "No schedule";
  }

  return new Date(value).toLocaleString();
}

export default function AdminHomeContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
  const [dealForm, setDealForm] = useState(emptyDealForm);

  const hasSupabase = useMemo(() => isSupabaseConfigured, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (!hasSupabase) {
        setPromotions([]);
        setDeals([]);
        setLoading(false);
        return;
      }

      const [promotionsResponse, dealsResponse] = await Promise.all([
        supabase
          .from("promotions")
          .select("*")
          .order("priority", { ascending: true }),
        supabase
          .from("home_deals")
          .select("*")
          .order("priority", { ascending: true }),
      ]);

      if (promotionsResponse.error) {
        throw promotionsResponse.error;
      }

      if (dealsResponse.error) {
        throw dealsResponse.error;
      }

      setPromotions((promotionsResponse.data ?? []) as PromotionRecord[]);
      setDeals((dealsResponse.data ?? []) as DealRecord[]);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load homepage content.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [hasSupabase]);

  const resetPromotionForm = () => {
    setSelectedPromotionId(null);
    setPromotionForm(emptyPromotionForm);
  };

  const resetDealForm = () => {
    setSelectedDealId(null);
    setDealForm(emptyDealForm);
  };

  const editPromotion = (promotion: PromotionRecord) => {
    setSelectedPromotionId(promotion.id);
    setPromotionForm({
      title: promotion.title,
      description: promotion.description,
      image_url: promotion.image_url || "",
      link_url: promotion.link_url || "/shop",
      cta_text: promotion.cta_text || "Shop now",
      is_active: promotion.is_active,
      start_date: toInputValue(promotion.start_date),
      end_date: toInputValue(promotion.end_date),
      priority: promotion.priority,
    });
    setError(null);
    setNotice(null);
  };

  const editDeal = (deal: DealRecord) => {
    setSelectedDealId(deal.id);
    setDealForm({
      title: deal.title,
      description: deal.description,
      image_url: deal.image_url || "",
      link_url: deal.link_url || "/shop",
      badge_text: deal.badge_text || "Deal",
      is_active: deal.is_active,
      start_date: toInputValue(deal.start_date),
      end_date: toInputValue(deal.end_date),
      priority: deal.priority,
    });
    setError(null);
    setNotice(null);
  };

  const savePromotion = async () => {
    if (!hasSupabase) {
      setError("Supabase is not configured. Add your environment variables to manage homepage content.");
      return;
    }

    if (!promotionForm.title.trim() || !promotionForm.description.trim()) {
      setError("A title and description are required for the carousel item.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        title: promotionForm.title.trim(),
        description: promotionForm.description.trim(),
        image_url: promotionForm.image_url.trim() || null,
        link_url: promotionForm.link_url.trim() || null,
        cta_text: promotionForm.cta_text.trim() || null,
        is_active: promotionForm.is_active,
        start_date: toIsoOrNull(promotionForm.start_date),
        end_date: toIsoOrNull(promotionForm.end_date),
        priority: Number(promotionForm.priority) || 0,
      };

      if (selectedPromotionId) {
        await adminApiRequest(`/api/admin/promotions/${selectedPromotionId}`, "PATCH", payload);
      } else {
        await adminApiRequest("/api/admin/promotions", "POST", payload);
      }

      resetPromotionForm();
      setNotice(selectedPromotionId ? "Carousel item updated." : "Carousel item created.");
      await loadAll();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save carousel content.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const saveDeal = async () => {
    if (!hasSupabase) {
      setError("Supabase is not configured. Add your environment variables to manage homepage deals.");
      return;
    }

    if (!dealForm.title.trim() || !dealForm.description.trim()) {
      setError("A title and description are required for the deal.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        title: dealForm.title.trim(),
        description: dealForm.description.trim(),
        image_url: dealForm.image_url.trim() || null,
        link_url: dealForm.link_url.trim() || null,
        badge_text: dealForm.badge_text.trim() || null,
        is_active: dealForm.is_active,
        start_date: toIsoOrNull(dealForm.start_date),
        end_date: toIsoOrNull(dealForm.end_date),
        priority: Number(dealForm.priority) || 0,
      };

      if (selectedDealId) {
        await adminApiRequest(`/api/admin/home-deals/${selectedDealId}`, "PATCH", payload);
      } else {
        await adminApiRequest("/api/admin/home-deals", "POST", payload);
      }

      resetDealForm();
      setNotice(selectedDealId ? "Deal updated." : "Deal created.");
      await loadAll();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save deal content.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deletePromotion = async (id: string) => {
    if (!hasSupabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await adminApiRequest(`/api/admin/promotions/${id}`, "DELETE");
      setNotice("Carousel item deleted.");
      await loadAll();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete carousel item.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteDeal = async (id: string) => {
    if (!hasSupabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await adminApiRequest(`/api/admin/home-deals/${id}`, "DELETE");
      setNotice("Deal deleted.");
      await loadAll();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete deal.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-products-shell">
      <div className="admin-products-header">
        <div className="admin-products-hero-card">
          <div>
            <div className="admin-kicker">Admin</div>
            <h1 className="admin-page-title">Homepage content</h1>
            <p className="admin-page-copy">
              Manage the hero carousel, product spotlight content, and homepage deals directly from Supabase.
            </p>
          </div>

          <div className="admin-products-stats">
            <span className="admin-pill admin-pill-success">
              {hasSupabase ? "Supabase connected" : "Supabase not configured"}
            </span>
            <span className="admin-pill admin-pill-info">{promotions.length} carousel items</span>
            <span className="admin-pill admin-pill-neutral">{deals.length} deals</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/admin/products" className="admin-secondary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            Back to products
          </a>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: 12,
            background: "rgba(248, 113, 113, 0.14)",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: 12,
            background: "rgba(74, 222, 128, 0.14)",
            color: "#bbf7d0",
          }}
        >
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="admin-empty-state">Loading homepage content…</div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          <section style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 className="admin-modal-title">Carousel content</h2>
              <p className="admin-page-copy">Create or edit campaign banners that appear in the homepage carousel.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <div className="admin-modal-card" style={{ padding: 20, maxWidth: "none" }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label className="admin-form-field">
                    <span className="admin-form-label">Title</span>
                    <input
                      className="admin-form-input"
                      value={promotionForm.title}
                      onChange={(event) => setPromotionForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Summer sale"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Description</span>
                    <textarea
                      className="admin-form-input"
                      rows={4}
                      value={promotionForm.description}
                      onChange={(event) => setPromotionForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Fresh essentials, curated looks, and limited-time savings."
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Image URL</span>
                    <input
                      className="admin-form-input"
                      value={promotionForm.image_url}
                      onChange={(event) => setPromotionForm((current) => ({ ...current, image_url: event.target.value }))}
                      placeholder="https://cdn.example.com/banner.jpg"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Link URL</span>
                    <input
                      className="admin-form-input"
                      value={promotionForm.link_url}
                      onChange={(event) => setPromotionForm((current) => ({ ...current, link_url: event.target.value }))}
                      placeholder="/shop"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">CTA text</span>
                    <input
                      className="admin-form-input"
                      value={promotionForm.cta_text}
                      onChange={(event) => setPromotionForm((current) => ({ ...current, cta_text: event.target.value }))}
                      placeholder="Shop now"
                    />
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    <label className="admin-form-field">
                      <span className="admin-form-label">Priority</span>
                      <input
                        type="number"
                        className="admin-form-input"
                        value={promotionForm.priority}
                        onChange={(event) => setPromotionForm((current) => ({ ...current, priority: Number(event.target.value) || 0 }))}
                      />
                    </label>

                    <label className="admin-form-field" style={{ justifyContent: "center" }}>
                      <span className="admin-form-label">Active</span>
                      <input
                        type="checkbox"
                        checked={promotionForm.is_active}
                        onChange={(event) => setPromotionForm((current) => ({ ...current, is_active: event.target.checked }))}
                      />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="admin-form-field">
                      <span className="admin-form-label">Start date</span>
                      <input
                        type="datetime-local"
                        className="admin-form-input"
                        value={promotionForm.start_date}
                        onChange={(event) => setPromotionForm((current) => ({ ...current, start_date: event.target.value }))}
                      />
                    </label>
                    <label className="admin-form-field">
                      <span className="admin-form-label">End date</span>
                      <input
                        type="datetime-local"
                        className="admin-form-input"
                        value={promotionForm.end_date}
                        onChange={(event) => setPromotionForm((current) => ({ ...current, end_date: event.target.value }))}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button type="button" className="admin-cta-button" onClick={savePromotion} disabled={saving}>
                      {saving ? "Saving…" : selectedPromotionId ? "Update carousel" : "Create carousel item"}
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={resetPromotionForm} disabled={saving}>
                      Clear form
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {promotions.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state-soft">No carousel items yet.</div>
                ) : (
                  promotions.map((promotion) => (
                    <div key={promotion.id} className="admin-modal-card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div>
                          <div className="admin-product-name">{promotion.title}</div>
                          <div className="admin-product-meta">Priority {promotion.priority}</div>
                          <p style={{ marginTop: 8, color: "var(--text-soft)" }}>{promotion.description}</p>
                          <p style={{ marginTop: 8, color: "var(--text-soft)", fontSize: 13 }}>{formatDateLabel(promotion.start_date)} → {formatDateLabel(promotion.end_date)}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" className="admin-secondary-button" onClick={() => editPromotion(promotion)}>
                            Edit
                          </button>
                          <button type="button" className="admin-delete-button" onClick={() => void deletePromotion(promotion.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 className="admin-modal-title">Deals</h2>
              <p className="admin-page-copy">Create or edit homepage deal cards that appear in the deals carousel.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <div className="admin-modal-card" style={{ padding: 20, maxWidth: "none" }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label className="admin-form-field">
                    <span className="admin-form-label">Title</span>
                    <input
                      className="admin-form-input"
                      value={dealForm.title}
                      onChange={(event) => setDealForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Weekend sale"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Description</span>
                    <textarea
                      className="admin-form-input"
                      rows={4}
                      value={dealForm.description}
                      onChange={(event) => setDealForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Limited-time savings on your favourite drops."
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Image URL</span>
                    <input
                      className="admin-form-input"
                      value={dealForm.image_url}
                      onChange={(event) => setDealForm((current) => ({ ...current, image_url: event.target.value }))}
                      placeholder="https://cdn.example.com/deal.jpg"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Link URL</span>
                    <input
                      className="admin-form-input"
                      value={dealForm.link_url}
                      onChange={(event) => setDealForm((current) => ({ ...current, link_url: event.target.value }))}
                      placeholder="/shop"
                    />
                  </label>

                  <label className="admin-form-field">
                    <span className="admin-form-label">Badge text</span>
                    <input
                      className="admin-form-input"
                      value={dealForm.badge_text}
                      onChange={(event) => setDealForm((current) => ({ ...current, badge_text: event.target.value }))}
                      placeholder="30% OFF"
                    />
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    <label className="admin-form-field">
                      <span className="admin-form-label">Priority</span>
                      <input
                        type="number"
                        className="admin-form-input"
                        value={dealForm.priority}
                        onChange={(event) => setDealForm((current) => ({ ...current, priority: Number(event.target.value) || 0 }))}
                      />
                    </label>

                    <label className="admin-form-field" style={{ justifyContent: "center" }}>
                      <span className="admin-form-label">Active</span>
                      <input
                        type="checkbox"
                        checked={dealForm.is_active}
                        onChange={(event) => setDealForm((current) => ({ ...current, is_active: event.target.checked }))}
                      />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="admin-form-field">
                      <span className="admin-form-label">Start date</span>
                      <input
                        type="datetime-local"
                        className="admin-form-input"
                        value={dealForm.start_date}
                        onChange={(event) => setDealForm((current) => ({ ...current, start_date: event.target.value }))}
                      />
                    </label>
                    <label className="admin-form-field">
                      <span className="admin-form-label">End date</span>
                      <input
                        type="datetime-local"
                        className="admin-form-input"
                        value={dealForm.end_date}
                        onChange={(event) => setDealForm((current) => ({ ...current, end_date: event.target.value }))}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button type="button" className="admin-cta-button" onClick={saveDeal} disabled={saving}>
                      {saving ? "Saving…" : selectedDealId ? "Update deal" : "Create deal"}
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={resetDealForm} disabled={saving}>
                      Clear form
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {deals.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state-soft">No deals yet.</div>
                ) : (
                  deals.map((deal) => (
                    <div key={deal.id} className="admin-modal-card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div>
                          <div className="admin-product-name">{deal.title}</div>
                          <div className="admin-product-meta">Priority {deal.priority}</div>
                          <p style={{ marginTop: 8, color: "var(--text-soft)" }}>{deal.description}</p>
                          <p style={{ marginTop: 8, color: "var(--text-soft)", fontSize: 13 }}>{formatDateLabel(deal.start_date)} → {formatDateLabel(deal.end_date)}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" className="admin-secondary-button" onClick={() => editDeal(deal)}>
                            Edit
                          </button>
                          <button type="button" className="admin-delete-button" onClick={() => void deleteDeal(deal.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
