export type AppToastAction = {
  label: string;
  onAction: () => void;
};

export type AppToastPayload = {
  message: string;
  action?: AppToastAction;
  duration?: number;
};

export function showToast(payload: AppToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("drape_app_toast", {
      detail: payload,
    })
  );
}
