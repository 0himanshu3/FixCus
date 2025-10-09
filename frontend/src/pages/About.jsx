import React from "react";

const teamRoles = [
  { label: "Project Lead", color: "from-amber-500 to-pink-600", emoji: "🎩",user:"Himanshu Kumar" },
  { label: "Frontend Developer", color: "from-pink-500 to-purple-600", emoji: "💻",user:"Satyam Jha" },
  { label: "Backend Developer", color: "from-purple-500 to-violet-600", emoji: "🛠️",user:"Debopriyo Sen" }
];

const About = () => {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 overflow-x-hidden">
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="opacity-20 w-72 h-72 bg-gradient-to-tr from-yellow-400 via-pink-400 to-purple-400 absolute -top-32 left-1/2 -translate-x-1/2 rounded-full blur-2xl animate-pulse" />
        <div className="opacity-10 w-52 h-52 bg-gradient-to-tr from-indigo-400 via-purple-300 to-pink-300 absolute bottom-24 right-32 rounded-full blur-3xl" />
        <div className="hidden md:block opacity-10 w-40 h-40 bg-gradient-to-tr from-pink-400 via-yellow-200 to-purple-200 absolute top-40 -left-24 rounded-full blur-2xl" />
      </div>

      {/* Poster Card */}
      <section className="mt-16 w-full max-w-5xl mx-auto bg-white rounded-[32px] border-4 border-purple-200 shadow-2xl px-4 sm:px-12 py-12 relative z-10">
        {/* Title with Ribbon */}
        <div className="flex flex-col items-center text-center -mt-10 mb-10">
          <div className="inline-block px-8 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xl shadow-lg border-4 border-yellow-400 tracking-widest mb-3">
            🎪 ABOUT US
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-0 text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 bg-clip-text drop-shadow-lg select-none">
            Welcome to <span className="tracking-wider">FixCus</span>
          </h1>
        </div>

        {/* Intro */}
        <p className="max-w-3xl mx-auto text-lg text-gray-700 text-center leading-relaxed mt-2 mb-10">
          <span className="font-semibold text-[#b91c1c]">FixCus</span> is a
          <span className="inline-block mx-1 px-3 py-px bg-gradient-to-r from-yellow-300 to-pink-300 rounded-md text-pink-900 font-bold">community-powered</span>
          issue reporting and civic engagement platform that connects citizens with their local government. Our mission: build cleaner, smarter, and more responsive cities — one issue at a time.
        </p>

        {/* Mission and Vision */}
        <div className="grid md:grid-cols-2 gap-10 mt-10">
          <div className="p-8 rounded-2xl border-2 border-yellow-100 bg-gradient-to-br from-white via-yellow-50 to-pink-50 hover:shadow-2xl transition">
            <h2 className="text-2xl font-extrabold mb-2 flex items-center gap-2 text-purple-700"><span>🎯</span> Our Mission</h2>
            <p className="text-gray-600 text-lg">
              Empower citizens to brighten their city by providing a transparent, simple,
              and playful platform for issue reporting and problem-solving.
            </p>
          </div>
          <div className="p-8 rounded-2xl border-2 border-pink-100 bg-gradient-to-br from-white via-pink-50 to-yellow-50 hover:shadow-2xl transition">
            <h2 className="text-2xl font-extrabold mb-2 flex items-center gap-2 text-pink-700"><span>🌈</span> Our Vision</h2>
            <p className="text-gray-600 text-lg">
              Make government accessible and responsive — ensuring every voice is heard and every city is a show-stopping place to live.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="my-16">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-8 text-transparent bg-gradient-to-r from-pink-600 to-purple-700 bg-clip-text">
            🎠 How FixCus Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-7 bg-white rounded-2xl shadow-md border-2 border-purple-100 flex flex-col items-center hover:-translate-y-1 hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-yellow-300 to-orange-400 text-white text-3xl rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow">{/* Emoji ball flag */}🏷️</div>
              <h3 className="font-bold text-lg text-pink-700 mb-2">1. Report</h3>
              <p className="text-gray-600 text-base text-center">
                Share issues proactively — from potholes to street lighting — right from our playful interface.
              </p>
            </div>
            <div className="p-7 bg-white rounded-2xl shadow-md border-2 border-yellow-100 flex flex-col items-center hover:-translate-y-1 hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-pink-500 to-purple-400 text-white text-3xl rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow">{/* Emoji gear */}🦺</div>
              <h3 className="font-bold text-lg text-purple-700 mb-2">2. Assign</h3>
              <p className="text-gray-600 text-base text-center">
                We match reports to the right municipal team ensuring nothing falls through the cracks.
              </p>
            </div>
            <div className="p-7 bg-white rounded-2xl shadow-md border-2 border-pink-100 flex flex-col items-center hover:-translate-y-1 hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-purple-600 to-yellow-400 text-white text-3xl rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow">{/* Emoji sparkles */}🎉</div>
              <h3 className="font-bold text-lg text-yellow-600 mb-2">3. Resolve</h3>
              <p className="text-gray-600 text-base text-center">
                Track progress and celebrate fixes with community feedback and real-time updates.
              </p>
            </div>
          </div>
        </div>

        {/* Meet the Team */}
        <section className="mt-20 mb-10">
          <h2 className="text-3xl font-black text-center mb-6 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">🤹 Meet the FixCus Team</h2>
          <p className="text-gray-700 text-lg text-center max-w-3xl mx-auto mb-12">
            Our makers are a troupe of coders, dreamers, and creative problem-solvers with one mission: making civic life as magical — and responsive — as a world-class circus.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {teamRoles.map((role, idx) => (
              <div
                className={`w-56 bg-white p-6 rounded-xl border-2 border-purple-100 shadow-md hover:shadow-xl transition text-center flex flex-col items-center`}
                key={idx}
              >
                <div className={`w-16 h-16 mb-3 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner text-white bg-gradient-to-br ${role.color}`}>
                  {role.emoji}
                </div>
                <h3 className="font-semibold text-purple-900">{role.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{role.user}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default About;
