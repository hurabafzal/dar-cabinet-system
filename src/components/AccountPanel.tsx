import React, { useState } from "react";
import { useTranslation } from '../hooks/useTranslation';
import { isRTL } from '../utils/languageUtils';
import { getUserData } from "../helpers/jwtHelper";
import { GET_USER } from "../apiURL/endpoints";

interface AccountPanelProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
}

const AccountPanel: React.FC<AccountPanelProps> = ({ user, onClose, onLogout }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t, isRTL: isRtl } = useTranslation();

  const handleDeleteAccount = async () => {
    try {
      // JWT Token aus Cookies holen
      const userInfo = await getUserData();
      const token = userInfo?.token;
      if (!token) {
        alert(t('auth_error'));
        return;
      }

      // API-Call zum Löschen
      const response = await fetch(GET_USER(user.userId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(t('account_deleted'));
        setShowDeleteConfirm(false);
        onLogout(); // Logout nach erfolgreicher Löschung
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(t('delete_error', { error: errorData.message || t('error_generic') }));
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(t('network_error'));
    }
  };

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
      zIndex: 1000,
      direction: isRtl ? 'rtl' : 'ltr'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '90%',
        width: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        direction: isRtl ? 'rtl' : 'ltr',
        textAlign: isRtl ? 'right' : 'left'
      }}>
        {/* X-Button zum Schließen */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            [isRtl ? 'left' : 'right']: '15px',
            top: '10px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            transform: isRtl ? 'scaleX(-1)' : 'none'
          }}
        >
          ×
        </button>

        {!showDeleteConfirm ? (
          // Haupt-Account Panel
          <>
            <h2 style={{ 
              color: '#286d7c', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {t('welcome')}
            </h2>
            
            <p style={{ 
              marginBottom: '30px', 
              textAlign: 'center',
              color: '#666'
            }}>
              {t('hello_user', { name: user?.name || user?.userId || t('user') })}
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px' 
            }}>
              {/* Logout Button */}
              <button 
                onClick={onLogout}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#286d7c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {t('logout')}
              </button>

              {/* Delete Account Button */}
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {t('delete_account')}
              </button>
            </div>
          </>
        ) : (
          // Bestätigungs-Dialog
          <>
            <h2 style={{ 
              color: '#dc3545', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {t('delete_account_confirm')}
            </h2>
            
            <p 
              style={{ 
                marginBottom: '30px', 
                textAlign: 'center',
                color: '#666',
                lineHeight: '1.5',
                direction: isRtl ? 'rtl' : 'ltr'
              }}
              dangerouslySetInnerHTML={{ __html: t('delete_warning') }}
            />

            <div style={{ 
              display: 'flex', 
              gap: '15px',
              justifyContent: 'center'
            }}>
              {/* Abbrechen */}
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {t('cancel')}
              </button>

              {/* Bestätigen */}
              <button 
                onClick={handleDeleteAccount}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {t('yes_delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;