import React from "react";

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          <span className="toast-icon" aria-hidden="true">
            {toast.kind === "known" ? "\u2713" : "\u26A0"}
          </span>
          <div className="toast-body">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
          <button className="toast-dismiss" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
