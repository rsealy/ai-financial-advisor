import { useState, useCallback, useEffect } from 'react';

export default function PlaidLink({ onSuccess, children }) {
  const [linkToken, setLinkToken] = useState(null);

  const createLinkToken = useCallback(async () => {
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const data = await res.json();
      setLinkToken(data.link_token);
    } catch (err) {
      console.error('Failed to create link token:', err);
    }
  }, []);

  useEffect(() => {
    createLinkToken();
  }, [createLinkToken]);

  const handleClick = useCallback(async () => {
    if (!linkToken) {
      await createLinkToken();
      return;
    }

    // Load Plaid Link script dynamically if needed
    if (!window.Plaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.onload = () => openPlaidLink();
      document.head.appendChild(script);
    } else {
      openPlaidLink();
    }

    function openPlaidLink() {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (publicToken, metadata) => {
          onSuccess(publicToken, metadata);
          // Get a fresh token for next connection
          createLinkToken();
        },
        onExit: (err) => {
          if (err) console.error('Plaid Link exit error:', err);
          createLinkToken();
        },
      });
      handler.open();
    }
  }, [linkToken, onSuccess, createLinkToken]);

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
