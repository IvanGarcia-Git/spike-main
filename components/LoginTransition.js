"use client";

import { useEffect, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

export default function LoginTransition({ onComplete, loginBackground }) {
  const [showTransition, setShowTransition] = useState(true);

  useEffect(() => {
    // After animation completes, trigger the redirect
    const timer = setTimeout(() => {
      onComplete();
    }, 1300); // 0.4s delay + 0.8s animation + 0.1s buffer

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!showTransition) return null;

  return (
    <div className="login-transition-container">
      {/* Dashboard layer (background) - slides up from bottom */}
      <div className="dashboard-transition-layer">
        <div
          className="w-full h-full contracts-pastel-bg flex items-center justify-center"
        >
          <div className="text-center">
            <div className="login-success-indicator inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <span className="material-icons-outlined text-5xl text-primary">
                check_circle
              </span>
            </div>
            <h2 className="welcome-text-animate text-2xl font-bold text-slate-800 mb-2">
              ¡Bienvenido!
            </h2>
            <p className="welcome-text-animate text-slate-600" style={{ animationDelay: '0.2s' }}>
              Preparando tu espacio de trabajo...
            </p>
          </div>
        </div>
      </div>

      {/* Login layer (foreground) - slides up and out */}
      <div className="login-transition-layer">
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundImage: `url('${loginBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="w-full max-w-md">
            <div className="neumorphic-card p-8" style={{ boxShadow: 'none' }}>
              <div className="flex justify-center mb-8">
                <AnimatedLogo size="md" />
              </div>
              <div className="text-center">
                <div className="login-success-indicator inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
                  <span className="material-icons-outlined text-3xl text-white">
                    check
                  </span>
                </div>
                <p className="text-slate-700 font-medium">Sesión iniciada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
