import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { CONFIRM_PHONE } from "../apiURL/endpoints";

interface ConfirmPhoneModalProps {
  phone: string;
//   onSuccess: () => void;
  onClose: () => void;
}

const ConfirmPhoneModal: React.FC<ConfirmPhoneModalProps> = ({ phone, onClose }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        CONFIRM_PHONE,
        { phone, code },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data?.success) {
        alert("Phone confirmed successfully!");
        // onSuccess();
      } else {
        setError(response.data?.message || "Invalid code, please try again.");
      }
    } catch (err) {
      const error = err as AxiosError<any>;
      setError(error.response?.data?.message || "Failed to confirm phone");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "400px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
          padding: "30px 20px",
          textAlign: "center",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#333",
          }}
        >
          ×
        </button>

        <h1 className="login-title">Confirm Phone</h1>
        <p className="login-subtitle">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="login-input"
            style={{ textAlign: "center", fontSize: "20px", letterSpacing: "8px" }}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="login-footer">
          Didn’t get the code?{" "}
          <button
            type="button"
            onClick={() => alert("Resend API to be implemented")}
            className="login-signup-link"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default ConfirmPhoneModal;
