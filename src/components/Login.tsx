import React, { useState, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "../hooks/useTranslation";
import { CapacitorCookies } from "@capacitor/core";
import { AUTH_LOGIN } from "../apiURL/endpoints";

interface LoginProps {
  onSignupClick?: () => void;
  onLoginSuccess?: (user: any) => void; // NEU: Optional für Person-Icon
}

const Login: React.FC<LoginProps> = ({ onSignupClick, onLoginSuccess }) => {
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false); // NEU!
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      // Email or phone validation
      if (emailOrPhone.includes("@")) {
        if (!emailOrPhone.includes(".")) {
          setError(
            t("error_invalid_email", "Please enter a valid email address")
          );
          return;
        }
      } else {
        // Phone validation (basic)
        if (!/^\+?[0-9]{8,15}$/.test(emailOrPhone)) {
          setError(
            t("error_invalid_phone", "Please enter a valid phone number")
          );
          return;
        }
      }

      // Password validation
      if (password.length < 8) {
        setError(
          t("error_password_length", "Password must be at least 8 characters")
        );
        return;
      }

      const loginData = {
        ...(emailOrPhone.includes("@")
          ? { email: emailOrPhone }
          : { phone: emailOrPhone }),
        password: password,
      };

      const response = await axios.post(
        AUTH_LOGIN,
        loginData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data && response.data.accessToken) {
        // NEU: Remember Me Logic
        const maxAge = rememberMe ? 2592000 : 18000; // in seconds (30 days)
        const url = window.location.origin;

        await CapacitorCookies.setCookie({
          url,
          key: "jwt",
          value: response.data.accessToken,
          path: "/",
          expires: new Date(Date.now() + maxAge * 1000).toUTCString(),
        });
         const cookieString = maxAge 
              ? `jwt=${response.data.accessToken}; path=/; max-age=${maxAge}`
              : `jwt=${response.data.accessToken}; path=/`;
            
            document.cookie = cookieString;
        
        console.log("JWT Cookie set", response.data.accessToken);
        const decoded = jwtDecode(response.data.accessToken);

        // NEU: Falls Callback vorhanden (Person-Icon), verwende das
        if (onLoginSuccess) {
          const userData = {
            token: response.data.accessToken,
            userId: decoded.sub,
            name:
              (decoded as any).name || (decoded as any).userName || decoded.sub,
          };
          onLoginSuccess(userData);
        } else {
          // Original Verhalten: URL Redirect
          window.location.href =
            window.location.pathname + "?userid=" + decoded.sub;
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      const error = err as AxiosError<any>;
      setError(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="login-container">
      <div className="login-form-box">
        <h1 className="login-title">{t("login", "Login")}</h1>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Input Container für nebeneinander angeordnete Input-Felder */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                placeholder={t("email_or_phone", "Enter Email or Phone Number")}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="login-input"
                type="text"
                autoComplete="username"
                name="username"
              />
            </div>

            <div style={{ flex: 1 }}>
              <input
                placeholder={t("password", "Enter Password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                type="password"
                autoComplete="current-password"
                name="password"
              />
            </div>
          </div>

          {/* NEU: Remember Me Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                cursor: "pointer",
                color: "#666",
                userSelect: "none",
              }}
            >
              {t("remember_me", "Remember me for 30 days")}
            </label>
          </div>

          {/* Button Container - Login Button wieder einzeln */}
          <button
            type="submit"
            className="login-button flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="me-2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            {t("login", "Login")}
          </button>
        </form>

        <p className="login-footer">
          {t("no_account", "Don't have an account?")}{" "}
          <button
            onClick={onSignupClick}
            className="login-signup-link"
            type="button"
          >
            {t("signup", "Sign up")}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
