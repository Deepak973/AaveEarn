"use client";

import { useContext, useEffect } from "react";
import { toast, ToastContainer, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Alert_Kind__Enum_Type, AlertsContext } from "../app/AllertProvider";

export const Notifier = () => {
  const {
    state: { alert: notification },
    clearAlert,
  } = useContext(AlertsContext);

  useEffect(() => {
    if (!notification) return;

    // Dismiss all existing toasts before showing a new one
    toast.dismiss();

    const baseStyle = {
      background: "var(--secondary-bg)",
      color: "var(--text-secondary)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    } as React.CSSProperties;

    const options: ToastOptions = {
      position: "top-right",
      autoClose:
        notification.kind === Alert_Kind__Enum_Type.PROGRESS ? false : 5000,
      hideProgressBar: notification.kind !== Alert_Kind__Enum_Type.PROGRESS,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      style: baseStyle,
      className: "themed-toast",
      progressClassName: "themed-progress",
      icon: false,
      closeButton: false,
    };

    // Display based on kind
    switch (notification.kind) {
      case Alert_Kind__Enum_Type.SUCCESS:
        toast.success(notification.message, options);
        break;
      case Alert_Kind__Enum_Type.ERROR:
        toast.error(notification.message, options);
        break;

      case Alert_Kind__Enum_Type.INFO:
        toast.info(notification.message, options);
        break;
      case Alert_Kind__Enum_Type.PROGRESS:
        toast.loading(notification.message, {
          ...options,
          closeButton: false,
        });
        break;
      default:
        toast(notification.message, options);
    }

    if (notification.kind !== Alert_Kind__Enum_Type.PROGRESS) {
      const timeout = setTimeout(clearAlert, 5000);
      return () => clearTimeout(timeout);
    }
  }, [notification, clearAlert]);

  return (
    <>
      <ToastContainer
        theme="dark"
        limit={1}
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover
        toastClassName="themed-toast"
        progressClassName="themed-progress"
      />
      <style jsx global>{`
        .themed-toast {
          background: var(--secondary-bg) !important;
          color: var(--text-secondary) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 10px !important;
        }
        .Toastify__toast-body {
          font-size: 0.85rem !important;
        }
        .themed-progress {
          background: #94b9ff !important;
        }
      `}</style>
    </>
  );
};
