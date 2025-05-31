import { Intent, OverlayToaster, type IconName } from "@blueprintjs/core";

export const useToast = () => {
  const showToast = (message: string, intent: Intent, icon: IconName) => {
    OverlayToaster.create({
      position: "top-right",
      maxToasts: 3,
    }).show({
      message,
      intent,
      icon,
      timeout: intent === Intent.DANGER ? 5000 : 3000,
    });
  };

  const showSuccess = (message: string) => {
    showToast(message, Intent.SUCCESS, "tick");
  };

  const showError = (message: string) => {
    showToast(message, Intent.DANGER, "error");
  };

  const showWarning = (message: string) => {
    showToast(message, Intent.WARNING, "info-sign");
  };

  const showInfo = (message: string) => {
    showToast(message, Intent.NONE, "info-sign");
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
