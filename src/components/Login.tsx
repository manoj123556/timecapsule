import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5] flex items-center justify-center px-6 lg:px-20 relative overflow-hidden">

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT SIDE */}
        <div className="space-y-12">

          {/* Branding */}
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="TimeCapsule Logo"
              className="w-14 h-14 rounded-xl object-cover shadow-md"
            />
            <div className="h-[1px] w-10 bg-gray-300" />
            <span className="text-[11px] tracking-[0.35em] text-gray-500 uppercase">
              Personal Archive
            </span>
          </div>

          {/* Title */}
          <div className="leading-[0.85]">
            <h1 className="text-[80px] lg:text-[110px] font-serif italic text-[#1a1a1a]">
              Time
            </h1>
            <h1 className="text-[80px] lg:text-[110px] font-serif text-[#1a1a1a]">
              Capsule
            </h1>
          </div>

          {/* Description */}
          <p className="max-w-xl text-gray-500 text-[18px] leading-relaxed">
            Your life is a collection of moments. Preserve them in a sacred,
            private sanctuary designed for reflection.
          </p>

          {/* Features */}
          <div className="space-y-4 text-[16px] text-gray-500">
            <div className="flex items-center gap-3">🔒 End-to-end local privacy</div>
            <div className="flex items-center gap-3">✨ AI-powered reflection insights</div>
            <div className="flex items-center gap-3">📩 Daily memory reminders</div>
          </div>
        </div>

        {/* RIGHT SIDE (LOGIN CARD) */}
        <div className="flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-[460px] p-12 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] text-center">

            <h2 className="text-[24px] font-medium text-gray-800 mb-2">
              Welcome Back
            </h2>

            <p className="text-gray-400 text-sm mb-8">
              Continue your journey through time
            </p>

            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-full hover:bg-gray-50 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>

              <span className="text-[15px] text-gray-700 font-medium">
                Sign in with Google
              </span>
            </button>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* GUEST */}
            <button className="w-full py-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
              Continue as Guest
            </button>

            <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
              By entering, you agree to secure local storage of your memories.
            </p>
          </div>
        </div>
      </div>

      {/* FLOATING QUOTE */}
      <div className="hidden lg:block fixed bottom-10 right-10 bg-black text-white px-6 py-4 rounded-2xl shadow-lg max-w-[260px]">
        <p className="text-sm italic">
          "Memory is the treasury and guardian of all things."
        </p>
        <p className="text-xs mt-2 opacity-60">— CICERO</p>
      </div>

      {/* FOOTER */}
      <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.4em] text-gray-400">
        SECURE • PRIVATE • ETERNAL
      </div>
    </div>
  );
}