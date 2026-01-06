import { useState, useCallback } from 'react';
import { isMobile } from '@/lib/platform';

export interface ContactResult {
  contactId: string;
  displayName?: string;
  phoneNumbers?: Array<{ number?: string }>;
  emails?: Array<{ address?: string }>;
  photoThumbnail?: string;
}

export function useDeviceContacts() {
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!isMobile()) {
      setError('Contacts only available on mobile');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Mock contacts for now since plugin may not be installed
      const mockContacts = [
        { contactId: '1', displayName: 'John Doe', phoneNumbers: [{ number: '555-0100' }], emails: [{ address: 'john@example.com' }] },
        { contactId: '2', displayName: 'Jane Smith', phoneNumbers: [{ number: '555-0101' }], emails: [{ address: 'jane@example.com' }] },
        { contactId: '3', displayName: 'Bob Wilson', phoneNumbers: [{ number: '555-0102' }], emails: [{ address: 'bob@example.com' }] },
      ];

      setContacts(mockContacts);
      return mockContacts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Contacts fetch error';
      setError(message);
      console.error('[Contacts Error]', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearContacts = useCallback(() => {
    setContacts([]);
    setError(null);
  }, []);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    clearContacts,
  };
}
