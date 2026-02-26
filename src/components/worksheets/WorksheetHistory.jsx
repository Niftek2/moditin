import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Trash2, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorksheetHistory({ onLoadWorksheet }) {
  const [expandedId, setExpandedId] = useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const { data: worksheets = [], isLoading, refetch } = useQuery({
    queryKey: ["worksheetLogs", currentUser?.id],
    queryFn: () => base44.entities.WorksheetLog.filter({ created_by: currentUser?.email }, "-created_date", 50),
    enabled: !!currentUser?.id,
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this worksheet?")) return;
    await base44.entities.WorksheetLog.delete(id);
    refetch();
  };

  if (isLoading) return <p className="text-[var(--modal-text-muted)] text-sm">Loading history...</p>;

  if (worksheets.length === 0) {
    return <p className="text-[var(--modal-text-muted)] text-sm">No worksheets generated yet.</p>;
  }

  return (
    <div className="space-y-2">
      {worksheets.map((ws) => (
        <div key={ws.id} className="border border-[var(--modal-border)] rounded-xl p-4 hover:bg-[var(--modal-card-hover)] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--modal-text)] text-sm truncate">{ws.title}</h4>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {["auditory_comprehension", "self_advocacy_scripts", "minimal_pair_listening", "vocabulary_visual", "listening_recall"]
                    .includes(ws.templateType)
                    ? ws.templateType.replace(/_/g, " ")
                    : ws.templateType}
                </span>
                <span className="text-xs text-[var(--modal-text-muted)]">{ws.topic}</span>
                <span className="text-xs text-[var(--modal-text-muted)]">{ws.gradeLevel}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--modal-text-muted)] mt-2">
                <Clock className="w-3 h-3" />
                {format(parseISO(ws.created_date), "MMM d, yyyy h:mm a")}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadWorksheet(ws.worksheetContent)}
                className="border-[var(--modal-border)] text-[var(--modal-text)] hover:bg-[var(--modal-card-hover)]"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ws.id)}
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}