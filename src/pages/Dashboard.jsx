import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import {
  Users, Target, Clock, Car, CalendarDays,
  ChevronRight, FileText, ClipboardList, Plus, Ear
} from "lucide-react";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import { Button } from "@/components/ui/button";

function StatCard({ icon: Icon, label, value, sub, page, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Link
        to={createPageUrl(page)}
        className="modal-card block p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-[#EADDF5] flex items-center justify-center">
            {Icon === HearingAidIcon
              ? <HearingAidIcon size={20} strokeColor="#6B2FB9" />
              : <Icon className="w-5 h-5 text-[#6B2FB9]" strokeWidth={2.5} />}
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--modal-border)] group-hover:text-[#6B2FB9] transition-colors" />
        </div>
        <p className="text-3xl font-bold text-[var(--modal-text)]">{value}</p>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">{label}</p>
        {sub && <p className="text-xs text-[#6B2FB9] mt-0.5">{sub}</p>}
      </Link>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, page, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link
        to={createPageUrl(page)}
        className="flex items-center gap-3 bg-white border border-[var(--modal-border)] rounded-2xl px-4 py-4 hover:border-[#6B2FB9] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
        style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-[#EADDF5] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#6B2FB9]" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-medium text-[var(--modal-text)]">{label}</span>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "";
  const monthName = new Date().toLocaleString("default", { month: "long" });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["studentGoals"],
    queryFn: () => base44.entities.StudentGoal.list(),
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services-dash"],
    queryFn: () => base44.entities.ServiceEntry.list("-created_date", 50),
  });
  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-dash"],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyMinutes = services
    .filter(s => s.monthKey === currentMonth)
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[var(--modal-text)]">
          {firstName ? `👋 Welcome back, ${firstName}` : "👋 Welcome back"}
        </h1>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">
          Here's your overview for the month.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={Users} label="Active Students" value={students.length} page="Students" delay={0} />
        <StatCard icon={Target} label="Active Goals" value={goals.filter(g => g.status === "Active").length} page="GoalBank" delay={0.05} />
        <StatCard
          icon={Clock}
          label="Hours This Month"
          value={`${(monthlyMinutes / 60).toFixed(1)}h`}
          sub={`${monthlyMinutes} minutes`}
          page="ServiceHours"
          delay={0.1}
        />
        <StatCard icon={HearingAidIcon} label="Equipment Items" value={equipment.length} page="Equipment" delay={0.15} />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <QuickAction icon={Clock} label="Log Service" page="ServiceHours" delay={0.2} />
          <QuickAction icon={CalendarDays} label="Plan Activity" page="ActivityPlanner" delay={0.22} />
          <QuickAction icon={Car} label="Log Mileage" page="Mileage" delay={0.24} />
          <QuickAction icon={FileText} label="Worksheets" page="Worksheets" delay={0.26} />
          <QuickAction icon={ClipboardList} label="Testing" page="TestingDecisions" delay={0.28} />
          <QuickAction icon={Ear} label="Ling 6 Check" page="Ling6Check" delay={0.30} />
        </div>
      </div>

      {/* Recent Service Entries */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.35 }}
        className="modal-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Recent Service Entries</h2>
          <Link to={createPageUrl("ServiceHours")} className="text-xs text-[#6B2FB9] hover:underline font-medium">
            View all
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EADDF5] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-[#6B2FB9]" />
            </div>
            <p className="text-sm font-medium text-[var(--modal-text)] mb-1">📋 No service entries yet</p>
            <p className="text-xs text-[var(--modal-text-muted)] mb-4">
              Start logging your first service to see monthly totals here.
            </p>
            <Link to={createPageUrl("ServiceHours")}>
              <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2" size="sm">
                <Plus className="w-3.5 h-3.5" /> Log Service
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--modal-border)]">
            {services.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-[var(--modal-text)]">
                    {entry.category?.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                </div>
                <span className="text-sm font-semibold text-[#6B2FB9]">{entry.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}