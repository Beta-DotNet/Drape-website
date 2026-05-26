"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/data";

type ReviewRecord = {
  id: string;
  productId: number;
  rating: number;
  reviewer: string;
  isAnonymous: boolean;
  title: string;
  body: string;
  imageData?: string;
  createdAt: string;
};

type ReviewStore = {
  productId: number;
  reviews: ReviewRecord[];
};

interface ReviewSystemProps {
  product: Product;
  initialAverage?: number;
  initialCount?: number;
}

const STORAGE_KEY = "drape_reviews_demo";
const USER_RATING_KEY = "drape_user_rating_demo";
const USER_NAME_KEY = "drape_demo_user_name";
const VISIBLE_COUNT = 5;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const clampRating = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

const makeSeedReviews = (product: Product): ReviewRecord[] => {
  const base = [
    {
      reviewer: "Tinashe M.",
      isAnonymous: false,
      rating: Math.max(4, clampRating(product.rating)),
      title: "Fits beautifully",
      body:
        "The fit is spot on and the quality feels premium. I’d definitely wear this again for a smart-casual look.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      reviewer: "Nandi K.",
      isAnonymous: false,
      rating: 5,
      title: "Luxury feel",
      body:
        "The fabric and stitching look polished and the size guidance was accurate. Great value for the finish.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
  ];

  const fallbackId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return base.map((review, index) => ({
    id: `${product.id}-${index}-${fallbackId}`,
    productId: product.id,
    ...review,
  }));
};

const getStoredReviews = (productId: number): ReviewRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ReviewStore[];
    const matched = parsed.find((item) => item.productId === productId);
    return matched?.reviews ?? [];
  } catch {
    return [];
  }
};

const saveStoredReviews = (productId: number, reviews: ReviewRecord[]) => {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ReviewStore[]) : [];
    const filtered = parsed.filter((item) => item.productId !== productId);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...filtered, { productId, reviews }])
    );
  } catch {
    // Ignore storage failures in demo mode.
  }
};

const compressImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (!result || typeof result !== "string") {
        reject(new Error("Unable to read image."));
        return;
      }

      const image = new Image();
      image.onload = () => {
        const maxWidth = 1200;
        const ratio = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to process image."));
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = () => reject(new Error("Unable to load image."));
      image.src = result;
    };

    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });

const StarIcon = ({ filled, size = 24 }: { filled: boolean; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M12 2.5 14.9 8.5l6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.5Z" />
  </svg>
);

export default function ReviewSystem({
  product,
  initialAverage = product.rating,
  initialCount = product.reviews,
}: ReviewSystemProps) {
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => {
    const storedReviews = getStoredReviews(product.id);
    return storedReviews.length > 0 ? storedReviews : makeSeedReviews(product);
  });
  const [displayCount, setDisplayCount] = useState(VISIBLE_COUNT);
  const [rating, setRating] = useState<number>(() => {
    if (typeof window === "undefined") {
      return 5;
    }

    const savedRating = window.localStorage.getItem(`${USER_RATING_KEY}:${product.id}`);
    return savedRating ? clampRating(Number(savedRating)) : 5;
  });
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(USER_NAME_KEY) ?? "";
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return Number(initialAverage.toFixed(1));
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [initialAverage, reviews]);

  const reviewCount = reviews.length || initialCount;
  const visibleReviews = reviews.slice(0, displayCount);
  const hasMore = reviews.length > displayCount;

  useEffect(() => {
    if (!status) return;

    const timeout = window.setTimeout(() => setStatus(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const persistReviews = (nextReviews: ReviewRecord[]) => {
    setReviews(nextReviews);
    saveStoredReviews(product.id, nextReviews);
  };

  const activeRating = previewRating ?? rating;

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (rating < 1 || rating > 5) {
      nextErrors.rating = "Please select a rating between 1 and 5 stars.";
    }

    if (!isAnonymous && reviewerName.trim().length < 2) {
      nextErrors.reviewer = "Please enter your name or tick Anonymous.";
    }

    if (title.trim().length < 3) {
      nextErrors.title = "Please add a short review title.";
    }

    if (body.trim().length < 20) {
      nextErrors.body = "Your review needs at least 20 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", text: "Please upload a JPG, PNG, or WebP image." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ tone: "error", text: "Images must be 5MB or smaller." });
      return;
    }

    try {
      const data = await compressImage(file);
      setImageData(data);
      setStatus({ tone: "success", text: "Image preview is ready." });
    } catch {
      setStatus({ tone: "error", text: "We could not process that image. Please try another file." });
    }
  };

  const handleDropImage = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleImageUpload(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      setStatus({ tone: "error", text: "Please fix the highlighted fields and try again." });
      return;
    }

    setIsSubmitting(true);

    try {
      const newReview: ReviewRecord = {
        id: crypto.randomUUID(),
        productId: product.id,
        rating,
        reviewer: isAnonymous ? "Anonymous" : reviewerName.trim() || "Customer",
        isAnonymous,
        title: title.trim(),
        body: body.trim(),
        imageData: imageData ?? undefined,
        createdAt: new Date().toISOString(),
      };

      const nextReviews = [newReview, ...reviews];
      persistReviews(nextReviews);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${USER_RATING_KEY}:${product.id}`, String(rating));
        window.localStorage.setItem(USER_NAME_KEY, reviewerName.trim() || "Customer");
      }

      setRating(5);
      setPreviewRating(null);
      setTitle("");
      setBody("");
      setImageData(null);
      setIsAnonymous(false);
      setReviewerName("");
      setErrors({});
      setDisplayCount(VISIBLE_COUNT);
      setStatus({ tone: "success", text: "Thank you! Your review is now live." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = () => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(STORAGE_KEY);
    const seeded = makeSeedReviews(product);
    setReviews(seeded);
    saveStoredReviews(product.id, seeded);
    setDisplayCount(VISIBLE_COUNT);
    setTitle("");
    setBody("");
    setReviewerName("");
    setImageData(null);
    setErrors({});
    setStatus({ tone: "success", text: "Demo reviews reset." });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setPreviewRating((prev) => clampRating((prev ?? rating) + 1));
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setPreviewRating((prev) => clampRating((prev ?? rating) - 1));
    }
  };

  const handleBlurRating = () => {
    setPreviewRating(null);
  };

  return (
    <div className="review-system">
      <style jsx global>{`
        .review-system {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          padding: 18px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(249, 211, 67, 0.12), rgba(26, 58, 82, 0.04));
          border: 1px solid rgba(249, 211, 67, 0.2);
        }

        .review-score {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 180px;
        }

        .review-score-main {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .review-score-value {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-h);
          color: var(--navy);
        }

        .review-score-label {
          font-size: 0.9rem;
          color: var(--text-soft);
        }

        .review-breakdown {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 240px;
        }

        .review-breakdown-row {
          display: grid;
          grid-template-columns: 26px auto minmax(44px, 56px);
          align-items: center;
          gap: 10px;
          font-size: 0.84rem;
          color: var(--text-mid);
        }

        .review-breakdown-bar {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.08);
        }

        .review-breakdown-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--gold), #fef3c7);
        }

        .review-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .review-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: var(--text-mid);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .review-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }

        .review-form-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .review-form-title {
          margin: 0;
          font-size: 1.05rem;
          font-family: var(--font-h);
          color: var(--navy);
        }

        .review-form-copy {
          margin: 4px 0 0;
          color: var(--text-soft);
          font-size: 0.92rem;
        }

        .review-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .review-label {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--navy);
        }

        .review-input,
        .review-textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.96);
          color: var(--text);
          padding: 12px 14px;
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          font: inherit;
        }

        .review-input:focus,
        .review-textarea:focus {
          outline: none;
          border-color: rgba(249, 211, 67, 0.8);
          box-shadow: 0 0 0 4px rgba(249, 211, 67, 0.14);
        }

        .review-textarea {
          min-height: 116px;
          resize: vertical;
        }

        .review-checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }

        .review-checkbox-row input {
          width: 18px;
          height: 18px;
          accent-color: var(--navy);
        }

        .review-star-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .review-star-btn {
          min-width: 44px;
          min-height: 44px;
          padding: 6px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(15, 23, 42, 0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 160ms ease, color 160ms ease, background 160ms ease;
        }

        .review-star-btn:hover,
        .review-star-btn:focus-visible {
          color: var(--gold);
          background: rgba(249, 211, 67, 0.12);
          transform: translateY(-1px);
        }

        .review-star-btn.active {
          color: var(--gold);
        }

        .review-help {
          color: var(--text-soft);
          font-size: 0.85rem;
        }

        .review-error {
          color: #b42318;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .review-upload-dropzone {
          border: 1.5px dashed rgba(15, 23, 42, 0.18);
          border-radius: 16px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .review-upload-dropzone:hover,
        .review-upload-dropzone:focus-within {
          border-color: rgba(249, 211, 67, 0.75);
          box-shadow: 0 0 0 4px rgba(249, 211, 67, 0.1);
        }

        .review-upload-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .review-upload-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .review-upload-thumb {
          position: relative;
          width: 84px;
          height: 84px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .review-upload-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-upload-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          border: 0;
          border-radius: 999px;
          width: 24px;
          height: 24px;
          background: rgba(15, 23, 42, 0.78);
          color: #fff;
          cursor: pointer;
        }

        .review-submit-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .review-btn {
          border: 0;
          border-radius: 999px;
          padding: 11px 18px;
          font-weight: 800;
          min-height: 44px;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
        }

        .review-btn:hover {
          transform: translateY(-1px);
        }

        .review-btn-primary {
          background: var(--navy);
          color: #fff;
        }

        .review-btn-secondary {
          background: #fff;
          color: var(--navy);
          border: 1px solid rgba(15, 23, 42, 0.12);
        }

        .review-status {
          padding: 12px 14px;
          border-radius: 14px;
          font-weight: 700;
          animation: reviewFadeIn 180ms ease;
        }

        .review-status.success {
          background: rgba(16, 185, 129, 0.12);
          color: #0f766e;
        }

        .review-status.error {
          background: rgba(239, 68, 68, 0.12);
          color: #b42318;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .review-card {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.96);
          animation: reviewFadeIn 220ms ease;
        }

        .review-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .review-card h4 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--navy);
        }

        .review-card p {
          margin: 8px 0 0;
          color: var(--text-mid);
          line-height: 1.6;
        }

        .review-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
          color: var(--text-soft);
          font-size: 0.8rem;
        }

        .review-photo-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .review-photo-strip img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          cursor: zoom-in;
        }

        .review-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 2000;
        }

        .review-lightbox img {
          max-width: min(90vw, 860px);
          max-height: 86vh;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .review-empty {
          text-align: center;
          padding: 24px 12px;
          color: var(--text-soft);
          border: 1px dashed rgba(15, 23, 42, 0.12);
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.8);
        }

        @keyframes reviewFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .review-summary {
            align-items: flex-start;
          }

          .review-submit-row {
            align-items: stretch;
          }

          .review-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="review-summary">
        <div className="review-score">
          <div className="review-score-main">
            <span className="review-score-value">{averageRating.toFixed(1)}</span>
            <div>
              <div className="review-star-row" aria-label={`Average rating ${averageRating.toFixed(1)} out of 5`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} aria-hidden="true">
                    <StarIcon filled={index < Math.round(averageRating)} size={18} />
                  </span>
                ))}
              </div>
              <div className="review-score-label">{reviewCount} customer reviews</div>
            </div>
          </div>
        </div>

        <div className="review-breakdown">
          {[5, 4, 3, 2, 1].map((starCount) => {
            const count = reviews.filter((review) => review.rating === starCount).length;
            const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

            return (
              <div className="review-breakdown-row" key={starCount}>
                <span>{starCount}</span>
                <div className="review-breakdown-bar">
                  <div className="review-breakdown-fill" style={{ width: `${percent}%` }} />
                </div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>

        <div className="review-actions">
          <span className="review-pill">
            <StarIcon filled size={16} />
            Your saved rating: {rating}/5
          </span>
          <button type="button" className="review-btn review-btn-secondary" onClick={handleResetDemo}>
            Reset Demo
          </button>
        </div>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="review-form-header">
          <div>
            <h3 className="review-form-title">Write a review</h3>
            <p className="review-form-copy">
              Share your fit notes, styling thoughts, and photos. Your rating updates instantly in the demo.
            </p>
          </div>
          <span className="review-pill">Live demo</span>
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-rating">Your rating</label>
          <div
            id="review-rating"
            role="slider"
            aria-label="Select your rating"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={activeRating}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onBlur={handleBlurRating}
            className="review-star-row"
          >
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const filled = value <= (previewRating ?? rating);

              return (
                <button
                  key={value}
                  type="button"
                  className={`review-star-btn ${filled ? "active" : ""}`}
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                  onMouseEnter={() => setPreviewRating(value)}
                  onMouseLeave={() => setPreviewRating(null)}
                  onFocus={() => setPreviewRating(value)}
                  onClick={() => setRating(value)}
                >
                  <StarIcon filled={filled} size={28} />
                </button>
              );
            })}
          </div>
          <span className="review-help">Selected: {activeRating}/5</span>
          {errors.rating && <span className="review-error">{errors.rating}</span>}
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-name">Name</label>
          <input
            id="review-name"
            className="review-input"
            type="text"
            placeholder="e.g. Priya"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            disabled={isAnonymous}
          />
          <label className="review-checkbox-row">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            <span>Post as Anonymous</span>
          </label>
          {errors.reviewer && <span className="review-error">{errors.reviewer}</span>}
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-title">Review title</label>
          <input
            id="review-title"
            className="review-input"
            type="text"
            placeholder="Short summary"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          {errors.title && <span className="review-error">{errors.title}</span>}
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-body">Review body</label>
          <textarea
            id="review-body"
            className="review-textarea"
            placeholder="Describe fit, fabric, comfort, and what stood out."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          {errors.body && <span className="review-error">{errors.body}</span>}
        </div>

        <div className="review-field">
          <label className="review-label">Upload a photo</label>
          <label
            className="review-upload-dropzone"
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={handleDropImage}
            style={{
              borderColor: isDraggingImage ? "rgba(249, 211, 67, 0.9)" : undefined,
              boxShadow: isDraggingImage ? "0 0 0 4px rgba(249, 211, 67, 0.12)" : undefined,
            }}
          >
            <div className="review-upload-row">
              <div>
                <strong>Click or drop an image</strong>
                <p className="review-help" style={{ margin: 0 }}>
                  JPG, PNG, or WebP up to 5MB. We compress the image for smooth previews.
                </p>
              </div>
              <span className="review-pill">Browse</span>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImageUpload(file);
                }
              }}
            />
            <div className="review-upload-preview">
              {imageData ? (
                <>
                  <div className="review-upload-thumb">
                    <img src={imageData} alt="Review preview" />
                    <button
                      type="button"
                      className="review-upload-remove"
                      aria-label="Remove image"
                      onClick={() => setImageData(null)}
                    >
                      ×
                    </button>
                  </div>
                </>
              ) : (
                <span className="review-help">No image selected yet.</span>
              )}
            </div>
          </label>
        </div>

        <div className="review-submit-row">
          <button
            type="submit"
            className="review-btn review-btn-primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit review"}
          </button>
          <span className="review-help">We store this demo data in your browser so it persists after refresh.</span>
        </div>

        {status && (
          <div className={`review-status ${status.tone}`} role="status">
            {status.text}
          </div>
        )}
      </form>

      <div className="review-list">
        {visibleReviews.length > 0 ? (
          visibleReviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card-top">
                <div>
                  <h4>{review.title}</h4>
                  <div className="review-star-row" style={{ marginTop: 6 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} aria-hidden="true">
                        <StarIcon filled={index < review.rating} size={14} />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="review-meta">
                  <span>{review.reviewer}</span>
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
              <p>{review.body}</p>
              {review.imageData && (
                <div className="review-photo-strip">
                  <img
                    src={review.imageData}
                    alt={`${review.reviewer} review photo`}
                    onClick={() => setLightboxImage(review.imageData ?? null)}
                  />
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="review-empty">No reviews yet. Be the first to share your experience.</div>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          className="review-btn review-btn-secondary"
          onClick={() => setDisplayCount((count) => count + VISIBLE_COUNT)}
        >
          Load more reviews
        </button>
      )}

      {lightboxImage && (
        <div
          className="review-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Expanded review photo" />
        </div>
      )}
    </div>
  );
}
