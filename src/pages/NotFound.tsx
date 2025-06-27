import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
      <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md w-full">
        <div className="flex flex-col items-center mb-4">
          <div className="text-5xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#BFA14A', letterSpacing: 1 }}>SHOWER STATION</div>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-[#BFA14A]">404</h1>
        <p className="text-xl text-gray-700 mb-4">Oops! Page not found</p>
        <a href="/" className="inline-block border border-[#BFA14A] text-[#BFA14A] rounded-md px-6 py-2 font-semibold hover:bg-[#BFA14A] hover:text-white transition">
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
};

export default NotFound;
