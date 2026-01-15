import React, { useState } from "react";
import Login from "./Login";
import axios, { AxiosError } from "axios";
import { useTranslation } from "../hooks/useTranslation";
import ConfirmPhoneModal from "./ConfirmPhoneModal";
import { GET_USERS } from "../apiURL/endpoints";

interface AuthModalProps {
  onRedirect: () => void;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
  showPaymentMessage?: boolean;
}

const Signup = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userName || userName.length < 2) {
      setError(t('error_name_length', 'Name must be at least 2 characters'));
      return;
    }
    if (!email.includes("@")) {
      setError(t('error_invalid_email', 'Please enter a valid email address'));
      return;
    }
    if (password.length < 8) {
      setError(t('error_password_length', 'Password must be at least 8 characters'));
      return;
    }
   if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
   }
    if (phone.length < 8) {
      setError(t('error_phone_length', 'Phone must be at least 8 characters'));
      return;
    }

    const payload = {
      userName,
      email,
      password,
      preferredLanguage,
      phone,
      userId: `cus-${phone}`,
      groupId: 3,
    };
    
    try {
      const response = await axios.post(
        GET_USERS,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        alert(t('user_created', 'User created successfully, login to continue'));
        onLoginClick();
      }
    } catch (err) {
      const error = err as AxiosError<any>;
      setError(error.response?.data?.message || t('registration_failed', 'Registration failed'));
    }
  }

  return (
    <div className="login-container register">
      <div className="login-form-box">
        <h1 className="login-title">{t('create_account', 'Create an Account')}</h1>
        <p className="login-subtitle">{t('create_account_subtitle', 'Please fill in the details below to sign up')}</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            placeholder={t('name', 'Name')}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="login-input"
            type="text"
          />
          <input
            placeholder={t('email', 'Email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            type="email"
          />
          <input
            placeholder={t('password', 'Password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            type="password"
          />
          <input
            placeholder={t("confirm_password","Confirm Password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="login-input"
            type="password"
          />
          <input
            placeholder={t('phone', 'Phone Number')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="login-input"
            type="tel"
          />
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className="login-input"
          >
            <option value="" disabled>{t('preferred_language', 'Select Preferred Language')}</option>
            <option value="English">{t('language_english', 'English')}</option>
            <option value="Arabic">{t('language_arabic', 'Arabic')}</option>
          </select>
          <button type="submit" className="login-button">
            {t('signup', 'Sign Up')}
          </button>
        </form>
        <p className="login-footer">
          {t('has_account', 'Already have an account?')} {" "}
          <button onClick={onLoginClick} className="login-signup-link">
            {t('login', 'Login')}
          </button>
        </p>
      </div>
    </div>
  );
};

const AuthModal: React.FC<AuthModalProps> = ({ onRedirect, onClose, onLoginSuccess, showPaymentMessage = false }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<"login" | "signup" | "confirmPhone">("login");

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999999999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '90%',
        width: '500px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>

        {/* Payment message at the top */}
        {showPaymentMessage && (
          <div style={{
            backgroundColor: '#286d7c',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px 8px 0 0',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {t('account_required', '🔒 Account required for payment. Please login or create an account to continue.')}
          </div>
        )}

        {/* X-Button zum Schließen */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: showPaymentMessage ? '0' : '10px', // Angepasste Position
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          ×
        </button>

       {view === 'login' ? (
          <Login 
            onSignupClick={() => setView("signup")} 
            onLoginSuccess={onLoginSuccess}
          />
        ) :
        view === "confirmPhone" ?(
          <ConfirmPhoneModal phone={""} onClose={onClose} />
        ):
        (
          <Signup onLoginClick={() => setView("login")} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;