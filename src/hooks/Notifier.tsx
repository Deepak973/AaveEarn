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

    const options: ToastOptions = {
      position: "top-right",
      autoClose:
        notification.kind === Alert_Kind__Enum_Type.PROGRESS ? false : 5000,
      hideProgressBar: notification.kind !== Alert_Kind__Enum_Type.PROGRESS,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
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
    <ToastContainer
      theme="colored"
      limit={1} // Extra protection to allow only one toast
      closeOnClick
      pauseOnFocusLoss={false}
      pauseOnHover
    />
  );
};
