import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white flex flex-col justify-center items-center text-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring' }}
      >
        {/* Replaced SVG with Clown Emoji */}
        <div className="mb-8">
            <span className="text-8xl md:text-9xl leading-none" role="img" aria-label="Clown Face">🤡</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-pink-200 drop-shadow-lg">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-bold text-white">
          Page Not Found
        </p>
        <p className="mt-2 max-w-md text-pink-100">
          Looks like you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>

        <button
          onClick={() => navigate('/')}
          className="mt-10 px-8 py-4 bg-pink-500 hover:bg-pink-600 rounded-full font-bold text-lg border-4 border-purple-300 shadow-lg transform hover:scale-105 transition-all"
        >
          Go Back Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;