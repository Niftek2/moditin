import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Users, Target, Clock, Car, Headphones, CalendarDays,
  TrendingUp, ChevronRight, FileText, TestTube2, ClipboardCheck
} from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

function StatCard({ icon: Icon, label, value, page, color }) {
  return (
    <Link to={createPageUrl(page)} className="modal-card p-5 hover:bg-[var(--modal-card-hover)] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--modal-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">{label}</p>
    </Link>
  );
}

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  
  useEffect(() => {
    base44.auth.me().then(u => setUserName(u?.full_name || "")).catch(() => {});
  }, []);

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
  const monthlyMinutes = services.filter(s => s.monthKey === currentMonth).reduce((sum, s) => sum + (s.minutes || 0), 0);

  return (
    <div>
      <PageHeader
        title={userName ? `Welcome back, ${userName.split(" ")[0]}` : "Dashboard"}
        subtitle="Your itinerant teaching hub"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Students" value={students.length} page="Students" color="bg-[#400070]" />
        <StatCard icon={Target} label="Active Goals" value={goals.filter(g => g.status === "Active").length} page="GoalBank" color="bg-purple-700" />
        <StatCard icon={Clock} label="Hours This Month" value={`${(monthlyMinutes / 60).toFixed(1)}h`} page="ServiceHours" color="bg-indigo-600" />
        <StatCard icon={Headphones} label="Equipment" value={equipment.length} page="Equipment" color="bg-violet-600" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--modal-text-muted)] uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Log Service", icon: Clock, page: "ServiceHours" },
            { label: "Plan Activity", icon: CalendarDays, page: "ActivityPlanner" },
            { label: "Log Mileage", icon: Car, page: "Mileage" },
            { label: "Worksheets", icon: FileText, page: "Worksheets" },
            { label: "Testing", icon: TestTube2, page: "TestingDecisions" },
          ].map((action) => (
            <Link
              key={action.page}
              to={createPageUrl(action.page)}
              className="modal-card p-4 flex items-center gap-3 hover:bg-[var(--modal-card-hover)] transition-all group"
            >
              <action.icon className="w-4 h-4 text-[var(--modal-purple-glow)]" />
              <span className="text-sm text-[var(--modal-text)]">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Service Entries */}
      <div className="modal-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--modal-text-muted)] uppercase tracking-wider">Recent Service Entries</h2>
          <Link to={createPageUrl("ServiceHours")} className="text-xs text-[var(--modal-purple-glow)] hover:underline">View all</Link>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-[var(--modal-text-muted)] text-center py-8">No service entries yet. Start logging your hours!</p>
        ) : (
          <div className="space-y-2">
            {services.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm text-white">{entry.category?.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                </div>
                <span className="text-sm font-medium text-[var(--modal-purple-glow)]">{entry.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}