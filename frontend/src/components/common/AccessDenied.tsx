import { Navigate } from "@tanstack/react-router";

// src/components/common/AccessDenied.tsx
export function AccessDeniedPage({ message }: { message?: string }) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="text-center text-red-600">
        <svg className="w-16 h-16 mx-auto mb-4">⚠️</svg>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          {message || "You do not have permission to access this resource."}
        </p>
        <button onClick={() => Navigate({ to: "/devices" })}>
          Back to Devices
        </button>
      </div>
    </div>
  );
}
