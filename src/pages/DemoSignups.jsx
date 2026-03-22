import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { FlaskConical } from "lucide-react";

export default function DemoSignups() {
  const { data: signups = [], isLoading } = useQuery({
    queryKey: ["demoSignups"],
    queryFn: () => base44.entities.DemoSignup.list("-created_date", 200),
  });

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <FlaskConical className="w-6 h-6 text-[#400070]" />
        <h1 className="text-2xl font-bold text-[var(--modal-text)]">Demo Sign-Ups</h1>
        <span className="ml-auto text-sm text-[var(--modal-text-muted)]">{signups.length} total</span>
      </div>

      {isLoading ? (
        <p className="text-[var(--modal-text-muted)]">Loading…</p>
      ) : signups.length === 0 ? (
        <p className="text-[var(--modal-text-muted)]">No demo sign-ups yet.</p>
      ) : (
        <div className="modal-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--modal-border)]">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} className="border-b border-[var(--modal-border)] last:border-0 hover:bg-[var(--modal-card-hover)]">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-[var(--modal-text-muted)]">
                    {s.created_date ? format(new Date(s.created_date), "MMM d, yyyy h:mm a") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}