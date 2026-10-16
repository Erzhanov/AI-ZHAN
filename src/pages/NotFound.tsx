import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 opacity-80" />

      {/* Blur Effect */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-30 top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] opacity-30 bottom-[-100px] right-[-100px]" />

      {/* Content */}
      <div className="relative z-10 text-center backdrop-blur-xl bg-white/5 border border-white/10 p-10 rounded-2xl shadow-2xl">
        
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          404
        </h1>

        <p className="mt-4 text-lg text-gray-300">
          Бет табылмады
        </p>

        <p className="text-sm text-gray-500 mt-2">
          Сіз сұраған бет жоқ немесе жойылған
        </p>

        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
        >
          Басты бетке қайту
        </Link>
      </div>
    </div>
  );
};

export default NotFound;