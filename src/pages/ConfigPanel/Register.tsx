// src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const Register = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_not_match', 'Passwords do not match'));
      return;
    }
    
    setError('');
    
    try {
      // Code-Anfrage an Backend senden (für Testzwecke, da der Endpunkt noch nicht existiert)
      console.log('Anfrage zum Senden eines Verifizierungscodes', formData.phone);
      
      // Im echten Szenario würdest du hier einen API-Call machen:
      // const response = await fetch('http://51.20.103.181/auth/send-verification', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     phone: formData.phone,
      //   }),
      // });
      // const data = await response.json();
      
      // Simuliere erfolgreiche Anfrage für Testzwecke
      // Zum nächsten Schritt (Verifizierungscode) wechseln
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Registrierung mit Verifizierungscode an Backend senden
      console.log('Registrierung mit Verifizierungscode', formData);
      
      // Im echten Szenario würdest du hier einen API-Call machen:
      // const response = await fetch('http://51.20.103.181/auth/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     userName: formData.userName,
      //     email: formData.email,
      //     phone: formData.phone,
      //     password: formData.password,
      //     verificationCode: formData.verificationCode,
      //   }),
      // });
      // const data = await response.json();
      
      // Zum Login navigieren
      navigate('/login', { state: { message: t('registration_success', 'Registration successful! Please log in.') } });
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4">{t('create_account', 'Create Account')}</h2>
          <p className="text-center text-muted mb-4">
            {step === 1
              ? t('enter_details', 'Please enter your details')
              : t('enter_verification_code', 'Please enter the verification code sent to your phone number')}
          </p>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleSubmitDetails}>
              <div className="mb-3">
                <label htmlFor="userName" className="form-label">{t('name', 'Name')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">{t('email', 'Email')}</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">{t('phone', 'Phone Number')}</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">{t('password', 'Password')}</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">{t('confirm_password', 'Confirm Password')}</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary">
                  {t('next', 'Next')}
                </button>
              </div>
              
              <div className="text-center mt-3">
                <Link to="/login" className="text-decoration-none">
                  {t('has_account', 'Already have an account?')} {t('login', 'Login')}
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-3">
                <label htmlFor="verificationCode" className="form-label">{t('verification_code', 'Verification Code')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="verificationCode"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline-secondary flex-fill"
                >
                  {t('back', 'Back')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-fill"
                >
                  {t('register', 'Register')}
                </button>
              </div>
              
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => handleSubmitDetails}
                  className="btn btn-link text-decoration-none"
                >
                  {t('code_not_received', "Didn't receive the code? Send again")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;