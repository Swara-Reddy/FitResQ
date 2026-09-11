import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import MobileNav from '../components/layout/MobileNav';
import Footer from '../components/layout/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex flex-col transition-colors duration-200 selection:bg-brand-500 selection:text-white">
      {/* Sticky Top Horizontal Navigation (Sidebar Removed) */}
      <TopNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col justify-between">
        <div className="w-full flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* Global Premium Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;
