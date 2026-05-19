import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import {
  FiClock,
  FiCalendar,
  FiSun,
  FiMoon,
} from "react-icons/fi";

const WelcomeUser = () => {
  const { user } = useSelector(
    (state) => state.auth
  );

  const [currentTime, setCurrentTime] =
    useState(new Date());

  // LIVE CLOCK
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // GREETING
  const hour = currentTime.getHours();

  let greeting = "Good Evening";

  let Icon = FiMoon;

  let iconColor = "text-indigo-500";

  if (hour < 12) {
    greeting = "Good Morning";

    Icon = FiSun;

    iconColor = "text-amber-500";
  } else if (hour < 18) {
    greeting = "Good Afternoon";

    Icon = FiSun;

    iconColor = "text-amber-500";
  }

  // DATE
  const formattedDate =
    currentTime.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      }
    );

  // TIME
  const formattedTime =
    currentTime.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  return (
    <div
      className="
        relative
        overflow-hidden

        bg-white

        border
        border-slate-200/70

        shadow-[0_8px_40px_rgba(0,0,0,0.04)]

        rounded-[2rem]

        p-4
        sm:p-5
        md:p-7

        mb-6
        md:mb-8
      "
    >
      {/* PREMIUM BLUR */}
      <div
        className="
          absolute
          -top-24
          -right-20

          w-56
          h-56

          bg-gradient-to-br
          from-blue-100
          to-cyan-100

          rounded-full

          blur-3xl

          opacity-50
        "
      />

      <div
        className="
          absolute
          -bottom-24
          -left-20

          w-56
          h-56

          bg-gradient-to-br
          from-indigo-100
          to-purple-100

          rounded-full

          blur-3xl

          opacity-50
        "
      />

      {/* MAIN */}
      <div
        className="
          relative
          z-10

          flex
          flex-col
          xl:flex-row

          xl:items-center
          xl:justify-between

          gap-5
        "
      >
        {/* LEFT */}
        <div
          className="
            flex
            items-center

            gap-3
            sm:gap-4

            min-w-0
          "
        >
          {/* ICON */}
          <div
            className="
              w-14
              h-14
              sm:w-16
              sm:h-16

              rounded-[1.4rem]

              bg-gradient-to-br
              from-slate-50
              to-blue-50

              border
              border-slate-100

              flex
              items-center
              justify-center

              shadow-inner

              flex-shrink-0
            "
          >
            <Icon
              className={`
                text-2xl
                sm:text-3xl

                ${iconColor}
              `}
            />
          </div>

          {/* TEXT */}
          <div className="min-w-0">
            {/* TOP */}
            <div
              className="
                flex
                flex-wrap

                items-center

                gap-2
                sm:gap-3

                mb-1
              "
            >
              <h1
                className="
                  text-lg
                  sm:text-2xl
                  md:text-3xl

                  font-black

                  text-slate-800

                  leading-tight

                  truncate
                "
              >
                {greeting},{" "}
                <span
                  className="
                    text-transparent
                    bg-clip-text

                    bg-gradient-to-r
                    from-indigo-600
                    to-blue-500
                  "
                >
                  {user?.name || "User"}
                </span>
              </h1>

              {/* ROLE */}
              <span
                className="
                  px-3
                  py-1

                  rounded-xl

                  bg-indigo-50

                  border
                  border-indigo-100

                  text-indigo-600

                  text-[10px]
                  sm:text-xs

                  font-black

                  uppercase

                  tracking-wider

                  whitespace-nowrap

                  shadow-sm
                "
              >
                {user?.role || "Guest"}
              </span>
            </div>

            {/* SUBTEXT */}
            <p
              className="
                hidden
                md:block

                text-sm

                text-slate-500

                font-medium

                leading-relaxed
              "
            >
              Here is what's happening across
              your workspace today.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="
            w-full
            xl:w-auto
          "
        >
          {/* COMBINED CARD */}
          <div
            className="
              flex
              items-center
              justify-between

              gap-3

              bg-[#f8fafc]

              border
              border-slate-100

              rounded-2xl

              px-4
              py-3

              shadow-sm

              hover:shadow-lg
              hover:-translate-y-1

              transition-all
              duration-300
            "
          >
            {/* DATE */}
            <div
              className="
                flex
                items-center

                gap-2

                min-w-0
              "
            >
              {/* ICON */}
              <div
                className="
                  w-10
                  h-10

                  rounded-xl

                  bg-white

                  border
                  border-slate-100

                  flex
                  items-center
                  justify-center

                  text-slate-400

                  shadow-sm

                  flex-shrink-0
                "
              >
                <FiCalendar size={16} />
              </div>

              {/* TEXT */}
              <div className="min-w-0">
                <p
                  className="
                    text-[9px]

                    font-black

                    uppercase

                    tracking-wider

                    text-slate-400

                    mb-0.5
                  "
                >
                  Today
                </p>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-bold

                    text-slate-700

                    truncate
                  "
                >
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* DIVIDER */}
            <div
              className="
                w-px
                h-10

                bg-slate-200

                flex-shrink-0
              "
            />

            {/* TIME */}
            <div
              className="
                flex
                items-center

                gap-2

                min-w-0
              "
            >
              {/* ICON */}
              <div
                className="
                  w-10
                  h-10

                  rounded-xl

                  bg-white

                  border
                  border-slate-100

                  flex
                  items-center
                  justify-center

                  text-indigo-400

                  shadow-sm

                  flex-shrink-0
                "
              >
                <FiClock size={16} />
              </div>

              {/* TEXT */}
              <div className="min-w-0">
                <p
                  className="
                    text-[9px]

                    font-black

                    uppercase

                    tracking-wider

                    text-slate-400

                    mb-0.5
                  "
                >
                  Time
                </p>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-bold

                    text-slate-700

                    font-mono

                    tracking-tight

                    whitespace-nowrap
                  "
                >
                  {formattedTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeUser;