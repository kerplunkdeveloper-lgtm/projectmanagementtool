import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiUser } from "react-icons/fi";

const Preloader = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const [show, setShow] = useState(true);
  const [activeFrame, setActiveFrame] = useState(1);

  useEffect(() => {
    let timer;
    if (!loading) {
      timer = setTimeout(() => {
        setShow(false);
      }, 2000); // Faster exit once loaded
    } else {
      setShow(true);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!show && !loading) return;

    // Much faster, snappier timings for the robot animation loop
    const timings = [200, 300, 300, 200, 300, 250, 250];
    let frame = 1;
    let timer;

    const nextFrame = () => {
      timer = setTimeout(() => {
        frame = frame === 7 ? 1 : frame + 1;
        setActiveFrame(frame);
        nextFrame();
      }, timings[frame - 1]);
    };

    nextFrame();

    return () => clearTimeout(timer);
  }, [show, loading]);

  if (!show && !loading) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#020710] overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background Decorations */}
      {/* Top Left Decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gray-50 dark:bg-gray-900 rounded-full blur-3xl opacity-60"></div>
      
      {/* Bottom Right Concentric Rings */}
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full border border-green-50 dark:border-green-900/30"></div>
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full border border-green-50 dark:border-green-900/20"></div>

      {/* Dotted Grid Pattern Left */}
      <div className="absolute top-1/2 left-12 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block">
        <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <g fill="#9CA3AF" fillRule="evenodd">
            {[0, 1, 2, 3].map(row => 
              [0, 1, 2, 3].map(col => (
                <circle key={`${row}-${col}`} cx={col * 20 + 4} cy={row * 20 + 4} r="2" />
              ))
            )}
          </g>
        </svg>
      </div>

      {/* Dotted Grid Pattern Right */}
      <div className="absolute top-1/3 right-12 opacity-20 pointer-events-none hidden lg:block">
        <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <g fill="#9CA3AF" fillRule="evenodd">
            {[0, 1, 2, 3].map(row => 
              [0, 1, 2, 3].map(col => (
                <circle key={`${row}-${col}`} cx={col * 20 + 4} cy={row * 20 + 4} r="2" />
              ))
            )}
          </g>
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center z-10 w-full max-w-3xl px-6 animate-[fadeIn_0.7s_ease-out]">
        
        {/* Robot Mascot Animation */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex flex-col items-center justify-center pointer-events-none mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <img
              key={num}
              src={`/Robots/robot-${num}.png`}
              alt=""
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-75 ease-out ${
                activeFrame === num ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* Shadow */}
          <div className="absolute -bottom-2 w-32 h-6 bg-black/5 dark:bg-black/30 rounded-[50%] blur-md transition-opacity duration-300"></div>
        </div>

        {/* User Info Pill */}
        <div className="flex items-center gap-2 mb-4 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700/50">
          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <FiUser className="text-green-600 dark:text-green-400 text-[10px]" />
          </div>
          <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            {user?.email || "Welcome"}
          </span>
          
        </div>

<div className="font-semibold">
   <span className="text-md font-semibold text-gray-600 italic dark:text-gray-300">
            {user?.department || "Welcome"}
          </span>
</div>
       
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Please wait a moment...</p>

        {/* Loading Indicator Dots */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-2.5 h-2.5 rounded-full bg-green-100 dark:bg-gray-700 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-bounce" style={{ animationDuration: '1.2s' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-100 dark:bg-gray-700 animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;


