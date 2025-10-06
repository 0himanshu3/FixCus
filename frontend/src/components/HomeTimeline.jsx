import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const TimelineStep = ({ step, idx, setActiveStep }) => {
  const isEven = idx % 2 === 0;
  return (
    <motion.div
      className="relative flex w-full items-start"
      onViewportEnter={() => setActiveStep(idx)}
      viewport={{ once: false, margin: "-50% 0px -50% 0px" }}
    >
      {/* Connector Dot - positioned in the center */}
      <div className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-pink-300 border-2 border-white/50 z-10"></div>
      
      {/* Content Box - alternating sides */}
      <div className={`w-1/2 p-4 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.6 }}
        >
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full shadow-xl border-2 border-white/40 ${step.color} text-3xl mb-3 ${isEven ? 'ml-auto' : 'mr-auto'}`}>
            {step.icon}
          </div>
          <h3 className="text-xl font-bold text-pink-200 mb-1">{step.title}</h3>
          <p className="text-sm text-pink-100 opacity-90 leading-relaxed">{step.desc}</p>
        </motion.div>
      </div>
       {/* Empty div for spacing on the other side */}
      <div className="w-1/2"></div>
    </motion.div>
  );
};

const InteractiveTimeline = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Publish Issue", desc: "Citizens raise issues in their locality — from broken roads to garbage piles.", icon: "📢", color: "bg-red-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Report+Issue" },
    { title: "Municipality Picks Up", desc: "Municipal admins review and log the issue into their division dashboard.", icon: "🏛️", color: "bg-yellow-400", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Admin+Dashboard" },
    { title: "Admin Assigns Team", desc: "Admins allocate coordinators, supervisors, and workers to handle it.", icon: "🧩", color: "bg-green-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Assigning+Crew" },
    { title: "Tasks Distributed", desc: "Coordinators delegate tasks and monitor progress on the dashboard.", icon: "📋", color: "bg-blue-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Task+Distribution" },
    { title: "Work in Progress", desc: "Workers upload photos, notes, and real-time updates from the field.", icon: "🧰", color: "bg-purple-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Work+Updates" },
    { title: "Review & Approve", desc: "Supervisors and admins verify proof and approve or reject submissions.", icon: "✅", color: "bg-pink-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Verification" },
    { title: "Auto Escalation", desc: "If work lags, the system escalates the task to higher authorities.", icon: "🚨", color: "bg-orange-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Escalation+Alert" },
    { title: "Final Summary", desc: "Supervisors submit completion reports with ratings and photos.", icon: "🏁", color: "bg-indigo-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=Completion+Report" },
    { title: "AI Feedback Summary", desc: "Citizens leave feedback that AI summarizes to highlight improvement areas.", icon: "🤖", color: "bg-rose-500", imageUrl: "https://placehold.co/600x400/1e1b4b/fda4af?text=AI+Feedback" },
  ];

  const { scrollYProgress } = useScroll();
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="relative bg-purple-900 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-extrabold text-pink-300 mb-6 drop-shadow-lg">
            🎪 The FixCus Journey
          </h2>
          <p className="text-lg text-pink-100 max-w-2xl mx-auto leading-relaxed">
            From raising an issue to celebrating its resolution — scroll to see how FixCus transforms complaints into collaboration and results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="sticky top-24 w-full h-[400px]">
            <div className="relative w-full h-full rounded-2xl border-4 border-pink-500/30 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-purple-900/50 z-10"></div>
              {steps.map((step, idx) => (
                <motion.img
                  key={step.imageUrl}
                  src={step.imageUrl}
                  alt={step.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: activeStep === idx ? 1 : 0, scale: activeStep === idx ? 1 : 1.05 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-pink-200 font-bold text-xl">{steps[activeStep].title}</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-1 bg-pink-500/20 -translate-x-1/2"></div>
            <motion.div
              className="absolute left-1/2 top-0 h-full w-1 bg-pink-400 origin-top -translate-x-1/2"
              style={{ scaleY }}
            />
            <div className="space-y-32">
              {steps.map((step, idx) => (
                <TimelineStep key={idx} step={step} idx={idx} setActiveStep={setActiveStep} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default InteractiveTimeline;