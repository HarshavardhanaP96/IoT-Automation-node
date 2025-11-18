// src/pages/Auth/LoginPage.tsx

import { useState, useMemo } from "react"; // 👈 Import useMemo
import { useNavigate, useSearch } from "@tanstack/react-router";
import { loginUser } from "../../api/authService";
import { z } from "zod";

// --- PASSWORD RULES SETUP ---

// 1. Define Regex and messages for each rule
const passwordRules = [
  {
    label: "Minimum 8 characters",
    regex: /.{8,}/,
    error: "Password must be at least 8 characters",
  },
  {
    label: "At least one uppercase letter",
    regex: /(?=.*[A-Z])/,
    error: "Password must include one uppercase letter",
  },
  {
    label: "At least one lowercase letter",
    regex: /(?=.*[a-z])/,
    error: "Password must include one lowercase letter",
  },
  {
    label: "At least one number",
    regex: /(?=.*\d)/,
    error: "Password must include one number",
  },
  {
    label: "At least one special character",
    regex: /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
    error: "Password must include one special character",
  },
];

// Single regex for strong password (used for final submission validation)
const strongPasswordRegex = new RegExp(
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?])[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]{8,}$"
);

// Zod Schema for final submission
const LoginSchema = z.object({
  username: z
    .string()
    .min(1, "Username/Email is required")
    .email("Invalid email format"),

  password: z.string().superRefine((val, ctx) => {
    if (!strongPasswordRegex.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password does not meet all security criteria.",
      });
    }
  }),
});

// Type for the form data
type LoginForm = z.infer<typeof LoginSchema>;

interface LoginSearch {
  redirect?: string;
}

// src/pages/Auth/LoginPage.tsx (Relevant component update)

// ... (Imports and Zod setup remain the same) ...

// 🔑 Updated PasswordChecklist component for live validation
const PasswordChecklist = ({ password }: { password: string }) => {
  const ruleStatus = useMemo(() => {
    return passwordRules.map((rule) => ({
      ...rule,
      met: rule.regex.test(password),
    }));
  }, [password]);

  const allMet = ruleStatus.every((rule) => rule.met);

  if (!password && !allMet) return null; // Only show list if user has started typing

  // Define Tailwind classes for met/unmet states
  const metTextColor = "text-blue-600"; // Text color for met rules
  const unmetTextColor = "text-gray-500";
  const metBgColor = "bg-blue-100"; // Background color for the checkmark
  const unmetBgColor = "bg-gray-300";
  const metBorderColor = "border-blue-500"; // Border color for the entire box

  return (
    <div
      className={`text-left mt-2 mb-3 p-3 border rounded-lg transition-all duration-300 
      ${
        allMet ? metBorderColor + " " + metBgColor : "border-gray-200 bg-white"
      }`}
    >
      <h4 className="text-sm font-semibold mb-1">Password Requirements:</h4>
      <ul className="text-sm list-none space-y-1 pl-0">
        {ruleStatus.map(({ label, met }) => (
          <li
            key={label}
            className={`flex items-center transition-colors duration-300 ${
              met ? metTextColor : unmetTextColor
            }`}
          >
            {/* Checkmark or X icon */}
            <span
              className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${
                met ? "bg-blue-500" : unmetBgColor
              }`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Use a checkmark for met, and a neutral dash or X for unmet */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={met ? "M5 13l4 4L19 7" : "M6 12h12"} // Dash for unmet rule
                />
              </svg>
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ... (rest of the LoginPage component code remains the same) ...

export default function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as LoginSearch;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // Ensure password starts empty for validation logic
  const [apiError, setApiError] = useState("");
  const [validationErrors, setValidationErrors] =
    useState<z.ZodFormattedError<LoginForm> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get a validation error string for a specific field
  const getFieldError = (fieldName: keyof LoginForm) => {
    return validationErrors?.[fieldName]?._errors?.[0];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setValidationErrors(null);

    const result = LoginSchema.safeParse({ username, password });

    if (!result.success) {
      setValidationErrors(result.error.format());
      return;
    }

    setIsLoading(true);

    try {
      await loginUser(result.data.username, result.data.password);

      const redirectTo = redirect || "/";
      await navigate({ to: redirectTo });
    } catch (e) {
      const errorMessage =
        "Login failed: Invalid credentials or connection error." + e;
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING ---

  const primaryColor = "bg-teal-900";
  const primaryTextColor = "text-teal-900";

  return (
    <div
      className={`h-screen ${primaryColor} flex justify-center items-center`}
    >
      <div className="bg-white rounded-lg p-8 w-96 text-center shadow-2xl">
        {" "}
        {/* Increased width slightly */}
        <h2 className={`text-2xl font-bold ${primaryTextColor}`}>Welcome</h2>
        <h3 className="text-gray-600 font-light mt-1 mb-6 text-lg">
          BusLog IIOT Gateway
        </h3>
        <form onSubmit={handleLogin}>
          {/* USERNAME INPUT */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full p-2.5 my-2.5 rounded-lg border block box-border 
              ${
                getFieldError("username") ? "border-red-500" : "border-gray-300"
              }`}
            required
            disabled={isLoading}
          />
          {getFieldError("username") && (
            <p className="text-red-500 text-left text-sm mt-[-5px] mb-2">
              {getFieldError("username")}
            </p>
          )}

          {/* PASSWORD INPUT */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // 🔑 onChange triggers live validation
            className={`w-full p-2.5 my-2.5 rounded-lg border block box-border
              ${
                getFieldError("password") ? "border-red-500" : "border-gray-300"
              }`}
            required
            disabled={isLoading}
          />

          {/* 🔑 LIVE PASSWORD CHECKLIST RENDERED HERE */}
          <PasswordChecklist password={password} />

          <button
            type="submit"
            className={`
              w-full p-2.5 rounded-lg text-white font-semibold mt-4 transition duration-200
              ${primaryColor} hover:bg-teal-800 
              ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
            `}
            disabled={isLoading}
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>

          {/* API Error Message */}
          {apiError && (
            <p className="text-red-700 bg-red-100 border border-red-400 p-2.5 rounded-md mt-4 text-sm">
              {apiError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
