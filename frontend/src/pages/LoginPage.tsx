import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserProfile } from '../context/authStore';
import { UtilityBar, GovFooter } from '../components/design-system';
import { LoginBackground } from '../components/login/LoginBackground';
import { LoginLeftPanel } from '../components/login/LoginLeftPanel';
import { LoginCard } from '../components/login/LoginCard';
import { SignInTransition } from '../components/login/SignInTransition';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionUser, setTransitionUser] = useState<UserProfile | null>(null);

  // If already authenticated and not transitioning, redirect to portal
  useEffect(() => {
    if (isAuthenticated && !isTransitioning) {
      navigate('/');
    }
  }, [isAuthenticated, isTransitioning, navigate]);

  const handleLoginSuccess = (authenticatedUser: UserProfile) => {
    setTransitionUser(authenticatedUser);
    setIsTransitioning(true);
  };

  const handleTransitionPeak = () => {
    // Peak of the radial flash: route change occurs right here!
    navigate('/');
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans">
      {/* 1. Shared Full-Viewport Animated Background */}
      <LoginBackground 
        isTransitioning={isTransitioning}
        chakraSpeedSeconds={isTransitioning ? 6 : 120}
      />

      {/* 2. Top Government Utility Bar (Languages, Theme & Accessibility) */}
      <div className="relative z-20">
        <UtilityBar />
      </div>

      {/* 3. Main Login Content (Two Halves with no seam) */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Panel: Emblem, Satyameva Jayate, Rotating Taglines & Animated Counters */}
          <div className="lg:col-span-7 flex justify-center lg:justify-start">
            <LoginLeftPanel isTransitioning={isTransitioning} />
          </div>

          {/* Right Panel: Glass Card with Institute/Official Switch & Demo Chips */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <LoginCard 
              onSuccess={handleLoginSuccess}
              isTransitioning={isTransitioning}
            />
          </div>
        </div>
      </main>

      {/* 4. Official Government Footer */}
      <div className="relative z-20">
        <GovFooter />
      </div>

      {/* 5. Cinematic Sign-In / Sign-Out Transition Overlay */}
      <SignInTransition
        isActive={isTransitioning}
        mode="login"
        userName={transitionUser?.name || user?.name || 'Authorized User'}
        userRole={transitionUser?.role || user?.role || 'OFFICIAL_SCRUTINY'}
        onPeak={handleTransitionPeak}
        onComplete={handleTransitionComplete}
      />
    </div>
  );
};
