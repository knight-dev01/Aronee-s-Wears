import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, ShieldCheck, Loader2, RefreshCw, AlertCircle, Sparkles, Inbox, LogOut } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, sendEmailVerification } from 'firebase/auth';

interface OtpVerificationProps {
  user: User;
  onVerified: () => void;
  onCancel: () => void;
}

export default function OtpVerification({ user, onVerified, onCancel }: OtpVerificationProps) {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  // Send the real, official Firebase verification email link using the template setup in Firebase
  const sendRealVerificationEmail = async (isResend = false) => {
    setIsSending(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setEmailSent(true);
      setResendTimer(30);
      if (isResend) {
        setError(null);
      }
    } catch (err: any) {
      console.error('Error sending Firebase email verification:', err);
      if (err?.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before asking for another email.');
      } else {
        setError('Could not trigger verification email. Please verify your internet connection or try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Automatically trigger email verification when the user arrives if not already verified
  useEffect(() => {
    if (user && !user.emailVerified) {
      sendRealVerificationEmail();
    }
  }, [user]);

  // Handle countdown timer for email resends
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Check the verification status securely by reloading the Firebase user instance
  const checkVerificationStatus = async (showManualFeedback = false) => {
    if (isChecking || isSuccess) return;
    setIsChecking(true);
    setError(null);
    try {
      // Fetch latest profile state directly from Firebase Authentication servers
      await user.reload();
      
      if (user.emailVerified) {
        // 1. Persist the subscriber's state in Firestore securely
        await setDoc(doc(db, 'subscribers', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Subscriber',
          joinedAt: serverTimestamp(),
          otpVerified: true,
          authProvider: 'google.com'
        }, { merge: true });

        // 2. Queue Welcome Offer Email record
        await addDoc(collection(db, 'welcomeEmails'), {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Subscriber',
          status: 'pending',
          template: 'welcome_offer',
          couponCode: 'ARONEEWELCOME10',
          createdAt: serverTimestamp()
        });

        // 3. Show Success transition
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 2500);
      } else {
        if (showManualFeedback) {
          setError("Email link clicked? We haven't detected the verification yet. Please click the link inside the email or try again in a moment.");
        }
      }
    } catch (err: any) {
      console.error('Error checking verification status:', err);
      setError('Could not sync verification status with the authentication servers.');
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-poll the user status in the background every 5 seconds so they don't even have to click verify!
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    if (user && !user.emailVerified && !isSuccess) {
      pollingInterval = setInterval(() => {
        checkVerificationStatus(false);
      }, 5000);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [user, isSuccess]);

  const handleManualCheck = () => {
    checkVerificationStatus(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-brand/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl text-center space-y-8 relative overflow-hidden border border-gray-100"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-purple-brand to-transparent rounded-full" />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="verification-pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Header Visual */}
              <div className="space-y-4">
                <div className="relative w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
                  <img src="/logo.png" alt="Aronee's Wears Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-1 right-1 flex h-4.5 w-4.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-purple-brand"></span>
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black font-display text-slate-brand tracking-tight">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-slate-brand/60 font-medium px-4 leading-relaxed">
                    We've sent an official Firebase verification link to <span className="text-slate-brand font-black block mt-0.5">{user.email}</span>
                  </p>
                </div>
              </div>

              {/* Status Message or Error */}
              <div className="space-y-3">
                <div className="p-4 bg-purple-brand/5 border border-purple-brand/10 rounded-2xl flex items-start gap-3 text-left">
                  <Inbox className="w-5 h-5 text-purple-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-purple-brand uppercase tracking-wider mb-1">How to complete:</h4>
                    <p className="text-[11px] font-medium text-slate-brand/70 leading-relaxed">
                      1. Open your mailbox and check for an email titled <span className="font-bold">"Verify your email for Aronee's Wears"</span>.<br />
                      2. Click the link inside. <br />
                      3. Return here — we'll automatically detect it and unlock your coupon code!
                    </p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 justify-center"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-semibold text-rose-700">{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isChecking}
                  onClick={handleManualCheck}
                  className="w-full bg-slate-brand hover:bg-slate-brand/95 text-white font-black text-xs tracking-widest uppercase py-4 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-light" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <span>I Have Verified My Email</span>
                  )}
                </motion.button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100/80">
                  {resendTimer > 0 ? (
                    <span className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-brand/20" />
                      Resend email in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => sendRealVerificationEmail(true)}
                      className="text-xs font-extrabold text-purple-brand hover:text-purple-brand/80 underline decoration-2 underline-offset-4 tracking-wide cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Resend Verification Email</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-extrabold text-slate-brand/50 hover:text-rose-600 uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="verification-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-6"
            >
              <div className="relative w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
                <img src="/logo.png" alt="Aronee's Wears Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black font-display text-slate-brand tracking-tight">
                  Welcome to the Club! 🎉
                </h3>
                <p className="text-xs text-slate-brand/70 max-w-sm mx-auto font-medium">
                  Your email has been successfully verified. Your exclusive <span className="text-purple-brand font-black">10% discount welcome coupon</span> is now active!
                </p>
              </div>
              <div className="p-4 bg-purple-brand/5 rounded-2xl inline-flex items-center gap-2 border border-purple-brand/10">
                <Sparkles className="w-4 h-4 text-purple-brand animate-pulse" />
                <span className="text-xs font-mono font-black text-purple-brand uppercase">Coupon Code: ARONEEWELCOME10</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
