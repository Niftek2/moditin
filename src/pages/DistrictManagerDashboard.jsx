import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Building2, AlertTriangle, Loader2, Check } from "lucide-react";

export default function DistrictManagerDashboard() {
  const [user, setUser] = useState(null);
  const [district, setDistrict] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add teacher form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");

  // Remove confirmation
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const me = await base44.auth.me();
      if (!me) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      if (me.role !== "manager" && me.role !== "admin") {
        setError("Access denied. This dashboard is for district managers only.");
        setLoading(false);
        return;
      }
      setUser(me);

      // Load the district record for this manager
      const districts = await base44.entities.District.filter({ managerEmail: me.email });
      if (districts.length === 0) {
        setError("No district found for your account. Please contact support.");
        setLoading(false);
        return;
      }
      const d = districts[0];
      setDistrict(d);

      // Load all teachers in this district
      const allTeachers = await base44.entities.User.filter({ districtId: d.id });
      setTeachers(allTeachers.filter(t => t.id !== me.id));
    } catch (e) {
      setError(e.message || "Failed to load district data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    setAddError("");
    setAddSuccess(false);
    if (!newEmail || !newEmail.includes("@")) {
      setAddError("Please enter a valid email address.");
      return;
    }
    if (!newName.trim()) {
      setAddError("Please enter the teacher's name.");
      return;
    }

    const activeTeachers = teachers.filter(t => t.districtStatus !== "pending_deletion");
    if (activeTeachers.length >= district.licensedTeacherCount) {
      setAddError(`You've reached your limit of ${district.licensedTeacherCount} licensed seats. Contact support to add more.`);
      return;
    }

    setAddLoading(true);
    try {
      // Invite the user
      await base44.users.inviteUser(newEmail, "user");

      // Find the newly created user and link to district
      await new Promise(r => setTimeout(r, 1000)); // brief wait for user creation
      const newUsers = await base44.entities.User.filter({ email: newEmail });
      if (newUsers.length > 0) {
        await base44.entities.User.update(newUsers[0].id, {
          districtId: district.id,
          districtStatus: "active",
        });
      }

      setAddSuccess(true);
      setNewEmail("");
      setNewName("");
      await loadData();
    } catch (e) {
      setAddError(e.message || "Failed to add teacher. They may already have an account.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacher) => {
    setRemoveLoading(true);
    try {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      await base44.entities.User.update(teacher.id, {
        districtStatus: "pending_deletion",
        scheduledDeletionDate: deletionDate.toISOString(),
      });

      setConfirmRemove(null);
      await loadData();
    } catch (e) {
      console.error("Failed to remove teacher:", e);
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const activeTeachers = teachers.filter(t => t.districtStatus !== "pending_deletion");
  const pendingTeachers = teachers.filter(t => t.districtStatus === "pending_deletion");
  const seatsUsed = activeTeachers.length;
  const seatsTotal = district?.licensedTeacherCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070]">
      {/* Header */}
      <div className="px-4 pt-10 pb-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">District Manager</h1>
            <p className="text-white/60 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Seat Usage Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white/70" />
              <span className="text-white font-semibold">Teacher Licenses</span>
            </div>
            <span className="text-white/60 text-sm">{district?.planName} Plan</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{seatsUsed}</span>
            <span className="text-white/50 text-lg mb-1">/ {seatsTotal} used</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all"
              style={{ width: `${Math.min((seatsUsed / seatsTotal) * 100, 100)}%` }}
            />
          </div>
          {seatsUsed >= seatsTotal && (
            <p className="text-amber-300 text-xs mt-2 font-medium">⚠ All seats are in use. Remove a teacher or contact support to add more.</p>
          )}
        </div>

        {/* Add Teacher */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-xl">
          <h2 className="text-base font-bold text-[#400070] mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add a Teacher
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Teacher's full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="teacher@district.org"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
            {addError && <p className="text-red-600 text-sm">{addError}</p>}
            {addSuccess && (
              <p className="text-green-600 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" /> Teacher invited! They'll receive a welcome email with login instructions.
              </p>
            )}
            <Button
              onClick={handleAddTeacher}
              disabled={addLoading || seatsUsed >= seatsTotal}
              className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl"
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite Teacher"}
            </Button>
          </div>
        </div>

        {/* Active Teachers */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-xl">
          <h2 className="text-base font-bold text-[#400070] mb-4">Active Teachers ({activeTeachers.length})</h2>
          {activeTeachers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No teachers added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activeTeachers.map(t => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.full_name || t.firstName || "—"}</p>
                    <p className="text-gray-500 text-xs">{t.email}</p>
                  </div>
                  <button
                    onClick={() => setConfirmRemove(t)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove teacher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Deletion */}
        {pendingTeachers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pending Deletion ({pendingTeachers.length})
            </h2>
            <ul className="space-y-2">
              {pendingTeachers.map(t => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-900">{t.email}</span>
                  <span className="text-amber-600 text-xs">
                    Deleted {t.scheduledDeletionDate ? new Date(t.scheduledDeletionDate).toLocaleDateString() : "soon"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-amber-700 text-xs mt-3">These accounts will be permanently deleted after a 30-day grace period. Contact support to reactivate.</p>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Teacher?</h3>
            <p className="text-gray-600 text-sm mb-1">
              <strong>{confirmRemove.email}</strong> will lose access to Modal Itinerant immediately.
            </p>
            <p className="text-gray-500 text-sm mb-5">
              Their account and data will be retained for 30 days in case you want to reactivate them. After 30 days, the account is permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmRemove(null)}
                disabled={removeLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleRemoveTeacher(confirmRemove)}
                disabled={removeLoading}
              >
                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}