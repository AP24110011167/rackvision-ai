import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';

interface VerifyEmailPageProps {
  onVerificationSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onVerificationSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.every((d) => d !== '')) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onVerificationSuccess();
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex items-center justify-center p-6 text-[#242A2D] font-sans-ui selection:bg-[#00A99D] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md editorial-panel rounded-xl p-8 md:p-10 bg-[#FFFFFF] border border-[#DEDCD4] shadow-xl text-center"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DEDCD4]">
          <div onClick={onNavigateToHome} className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded bg-[#111C27] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 text-[#00A99D]" />
            </div>
            <span className="font-editorial text-xl font-bold text-[#242A2D]">
              RackVision<span className="text-[#00A99D] italic font-normal">.ai</span>
            </span>
          </div>

          <button
            onClick={onNavigateToLogin}
            className="text-xs text-[#87939B] hover:text-[#242A2D] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#00A99D]/10 text-[#00A99D] flex items-center justify-center mx-auto mb-4 border border-[#00A99D]/20">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="font-editorial text-3xl font-bold text-[#242A2D] mb-2">
          Verify Terminal Authorization
        </h1>
        <p className="text-xs text-[#87939B] leading-relaxed mb-8 max-w-xs mx-auto">
          Enter the 6-digit cryptographic verification code dispatched to your enterprise terminal.
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono-code text-xl font-bold bg-[#F4F3EE] border border-[#DEDCD4] rounded focus:outline-none focus:border-[#00A99D] text-[#242A2D] shadow-xs"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !digits.every((d) => d !== '')}
            className="btn-primary-teal w-full py-3 rounded text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating Signature...</span>
              </>
            ) : (
              <>
                <span>Complete Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#DEDCD4] text-xs text-[#87939B]">
          <span>Did not receive a token? </span>
          <button
            onClick={() => setDigits(['', '', '', '', '', ''])}
            className="text-[#00A99D] font-semibold hover:underline cursor-pointer"
          >
            Resend Token
          </button>
        </div>
      </motion.div>
    </div>
  );
};
