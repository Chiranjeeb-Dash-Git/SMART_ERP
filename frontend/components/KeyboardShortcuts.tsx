'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        // Allow ESC to work even in inputs to close modals/blur
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        } else {
          return;
        }
      }

      // F1 = Company Selection
      if (e.key === 'F1') {
        e.preventDefault();
        router.push('/companies');
      }
      
      // F8 = Sales Voucher / F9 = Purchase Voucher (Route to vouchers page)
      if (e.key === 'F8' || e.key === 'F9') {
        e.preventDefault();
        router.push('/vouchers');
      }

      // CTRL + H = Home/Dashboard
      if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        router.push('/dashboard');
      }

      // CTRL + I = Inventory Dashboard
      if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        router.push('/stock-summary');
      }

      // CTRL + B = New Invoice
      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        router.push('/invoices');
      }

      // ALT + L = Ledgers
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        router.push('/ledgers');
      }

      // ALT + S = Stock Items
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        router.push('/items');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null;
}
