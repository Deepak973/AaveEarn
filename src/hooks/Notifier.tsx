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

    toast.dismiss(); // clear existing

    const baseStyle = {
      background: "#3b82f6", // orange → yellow → dark red
      color: "#fff",
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
      fontWeight: 500,
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
        toast.loading(notification.message, { ...options, closeButton: false });
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
          background: #3b82f6 !important;
          color: #fff !important;
          border-radius: 12px !important;
          font-weight: 500 !important;
        }
        .Toastify__toast-body {
          font-size: 0.9rem !important;
        }
        .themed-progress {
          background: #ffffff !important; /* white progress bar */
        }
      `}</style>
    </>
  );
};
