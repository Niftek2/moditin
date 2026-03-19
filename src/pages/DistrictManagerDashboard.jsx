import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserPlus, Trash2, Building2, AlertTriangle, Loader2,
  Check, CreditCard, ArrowUpCircle, X, RefreshCw
} from "lucide-react";

const PLANS = [
  { key: "individual", name: "Individual", priceIdUSD: "price_1T6xgSG8v8oKpU6mWxd1o56o", priceUSD: 249, minSeats: 1, maxSeats: 1,  trialDays: 14 },
  { key: "starter",    name: "Starter",    priceIdUSD: "price_1T6xgSG8v8oKpU6mjlatbmy2", priceUSD: 225, minSeats: 2, maxSeats: 5,  trialDays: 14 },
  { key: "district",   name: "District",   priceIdUSD: "price_1T6xgSG8v8oKpU6mvbhONM6m", priceUSD: 199, minSeats: 6, maxSeats: 20, trialDays: 14 },
  { key: "program",    name: "Program",    priceIdUSD: "price_1T6xgSG8v8oKpU6mTNO5gH8o", priceUSD: 175, minSeats: 21, maxSeats: 50, trialDays: 14 },
];

const STATUS_COLORS = {
  trialing: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-red-100 text-red-800",
};

export default function DistrictManagerDashboard() {
  const [user, setUser] = useState(null);
  const [district, setDistrict] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Add teacher form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");

  // Focus trap refs for modals
  const removeModalRef = useRef(null);
  const upgradeModalRef = useRef(null);
  const removeOpenerRef = useRef(null);
  const upgradeOpenerRef = useRef(null);

  // Remove confirmation
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Billing portal
  const [portalLoading, setPortalLoading] = useState(false);

  // Upgrade modal
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState(null);
  const [upgradeSeats, setUpgradeSeats] = useState(1);
  const [upgradePurchaserEmail, setUpgradePurchaserEmail] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // Focus trap for remove modal
  useEffect(() => {
    if (confirmRemove) {
      const el = removeModalRef.current?.querySelector('button');
      el?.focus();
    } else {
      removeOpenerRef.current?.focus();
    }
  }, [confirmRemove]);

  // Focus trap for upgrade modal
  useEffect(() => {
    if (showUpgrade) {
      const el = upgradeModalRef.current?.querySelector('button');
      el?.focus();
    } else {
      upgradeOpenerRef.current?.focus();
    }
  }, [showUpgrade]);

  const isCheckoutSuccess = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("checkout_success") === "1";

  const loadData = useCallback(async () => {
    setError("");
    try {
      const me = await base44.auth.me();
      if (!me) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      if (me.role !== "manager" && me.role !== "admin") {
        // If checkout_success and not yet promoted, return null district so we retry
        if (isCheckoutSuccess && retryCount < 6) {
          setLoading(false);
          return;
        }
        setError("Access denied. This dashboard is for district managers only.");
        setLoading(false);
        return;
      }
      setUser(me);
      setUpgradePurchaserEmail(me.email || "");

      let districts = await base44.entities.District.filter({ managerEmail: me.email });
      if (districts.length === 0) {
        if (isCheckoutSuccess && retryCount < 6) {
          setLoading(false);
          return;
        }
        // Auto-create a district for manually-promoted managers
        try {
          const created = await base44.functions.invoke("onUserRoleChange", {
            data: { role: 'manager', email: me.email, id: me.id, full_name: me.full_name },
            old_data: { role: 'user' }
          });
          if (created.data?.created) {
            districts = await base44.entities.District.filter({ managerEmail: me.email });
          }
        } catch (e) {
          console.error("Failed to auto-create district:", e);
        }
        if (districts.length === 0) {
          setError("No district found for your account. Please contact support.");
          setLoading(false);
          return;
        }
      }
      const d = districts[0];
      setDistrict(d);

      const teacherRes = await base44.functions.invoke("getDistrictTeachers", { districtId: d.id });
      const allTeachers = teacherRes.data?.teachers || [];
      setTeachers(allTeachers.filter(t => t.id !== me.id));
    } catch (e) {
      setError(e.message || "Failed to load district data.");
    } finally {
      setLoading(false);
    }
  }, [retryCount, isCheckoutSuccess]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll on checkout success until district record appears
  useEffect(() => {
    if (!isCheckoutSuccess) return;
    if (district) {
      // Clean up param
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      window.history.replaceState({}, "", url.toString());
      return;
    }
    if (retryCount >= 6 || loading) return;
    const t = setTimeout(() => {
      setRetryCount(r => r + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [isCheckoutSuccess, district, retryCount, loading]);

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
      setAddError(`You've reached your limit of ${district.licensedTeacherCount} licensed seats.`);
      return;
    }
    setAddLoading(true);
    try {
      const res = await base44.functions.invoke("assignTeacherToDistrict", {
        teacherEmail: newEmail,
        teacherName: newName.trim(),
        districtId: district.id,
      });
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
      await base44.functions.invoke("removeTeacher", {
        teacherId: teacher.id,
        districtId: district.id,
      });
      setConfirmRemove(null);
      await loadData();
    } catch (e) {
      console.error("Failed to remove teacher:", e);
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("stripePortal", {
        returnUrl: window.location.href,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error("Portal error:", e);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradeSelect = (plan) => {
    setUpgradePlan(plan);
    setUpgradeSeats(plan.minSeats);
    setUpgradeError("");
  };

  const handleUpgradeCheckout = async () => {
    if (!upgradePlan) return;
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app.");
      return;
    }
    if (!upgradePurchaserEmail || !upgradePurchaserEmail.includes("@")) {
      setUpgradeError("Please enter a valid email address.");
      return;
    }
    setUpgradeLoading(true);
    setUpgradeError("");
    try {
      const res = await base44.functions.invoke("districtCheckout", {
        priceId: upgradePlan.priceIdUSD,
        quantity: upgradeSeats,
        teacherEmails: [upgradePurchaserEmail],
        purchaserEmail: upgradePurchaserEmail,
        purchaserName: user?.full_name || "",
        planName: upgradePlan.name,
        trialDays: upgradePlan.trialDays,
        currency: "USD",
        successUrl: window.location.origin + "/DistrictManagerDashboard?checkout_success=1",
        cancelUrl: window.location.href,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setUpgradeError(res.data?.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setUpgradeError(e.message || "Checkout failed. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Checkout success loading state
  if (isCheckoutSuccess && !district && retryCount < 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
        <p className="text-white font-semibold text-lg">Setting up your district account…</p>
        <p className="text-white/50 text-sm">This usually takes just a few seconds.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    const isNoDistrict = error.includes("No district found");
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">{isNoDistrict ? "No Subscription Found" : "Access Error"}</h2>
          <p className="text-gray-600 mb-5">{isNoDistrict ? "We couldn't find an active district subscription linked to your account." : error}</p>
          {isNoDistrict && (
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "/DistrictPricing"}
                className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl"
              >
                Set Up Subscription
              </Button>
              <p className="text-xs text-gray-400">Already purchased? Contact <a href="mailto:support@modaleducation.com" className="underline">support@modaleducation.com</a></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeTeachers = teachers.filter(t => t.districtStatus !== "pending_deletion" && !t.isPendingInvite);
  const pendingInviteTeachers = teachers.filter(t => t.isPendingInvite);
  const pendingTeachers = teachers.filter(t => t.districtStatus === "pending_deletion");
  const seatsUsed = activeTeachers.length + pendingInviteTeachers.length;
  const seatsTotal = district?.licensedTeacherCount || 0;
  const currentPlanKey = PLANS.find(p => p.name === district?.planName)?.key;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070]">
      <div className="px-4 pt-10 pb-16 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">District Manager</h1>
            <p className="text-white/90 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white/70" />
              <span className="text-white font-semibold">Subscription</span>
            </div>
            {district?.status && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[district.status] || "bg-gray-100 text-gray-800"}`}>
                {district.status === "trialing" ? "Free Trial" : district.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-lg font-bold">{district?.planName} Plan</span>
          </div>

          {district?.trialEndDate && district.status === "trialing" && (
            <p className="text-white/90 text-sm mb-3">
              Trial ends {new Date(district.trialEndDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}

          {district?.status === "past_due" && (
            <p className="text-amber-300 text-sm mb-3 font-medium">⚠ Payment past due — please update your billing info.</p>
          )}
          {district?.status === "canceled" && (
            <p className="text-red-300 text-sm mb-3 font-medium">Your subscription has been canceled. Upgrade below to restore access.</p>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="border-white/30 text-white hover:bg-white/10 bg-transparent text-xs"
            >
              {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
              Manage Billing
            </Button>
            <Button
              size="sm"
              onClick={() => { upgradeOpenerRef.current = document.activeElement; setShowUpgrade(true); setUpgradePlan(null); }}
              className="bg-white text-[#400070] hover:bg-white/90 text-xs"
            >
              <ArrowUpCircle className="w-3 h-3" />
              Change Plan
            </Button>
          </div>
        </div>

        {/* Seat Usage Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white/70" />
              <span className="text-white font-semibold">Teacher Licenses</span>
            </div>
            <span className="text-white/90 text-sm">{seatsUsed} / {seatsTotal} used</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-5 mb-2 relative overflow-hidden" role="progressbar" aria-valuenow={seatsUsed} aria-valuemin={0} aria-valuemax={seatsTotal} aria-label="Seat usage">
            <div
              className="h-5 rounded-full bg-purple-400 transition-all flex items-center justify-end pr-2"
              style={{ width: `${Math.min((seatsUsed / seatsTotal) * 100, 100)}%` }}
            >
              {seatsUsed > 0 && <span className="text-[10px] font-bold text-white whitespace-nowrap">Capacity</span>}
            </div>
          </div>
          {seatsUsed >= seatsTotal && (
            <p className="text-amber-300 text-xs mt-1 font-medium">⚠ All seats in use. Change plan to add more.</p>
          )}
        </div>

        {/* Add Teacher */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-xl">
          <h2 className="text-base font-bold text-[#400070] mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add a Teacher
          </h2>
          <div className="space-y-3">
            <Input placeholder="Teacher's full name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input type="email" placeholder="teacher@district.org" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <div aria-live="polite" role="status">
              {addError && <p className="text-red-600 text-sm" role="alert">{addError}</p>}
              {addSuccess && (
                <p className="text-green-600 text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" /> Teacher invited! They'll receive a welcome email with their temporary password.
                </p>
              )}
            </div>
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
                    ref={confirmRemove?.id === t.id ? removeOpenerRef : undefined}
                    onClick={() => { removeOpenerRef.current = document.activeElement; setConfirmRemove(t); }}
                    aria-label={`Remove ${t.full_name || t.email}`}
                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Invites */}
        {pendingInviteTeachers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-bold text-blue-800 mb-3">Pending Invitations ({pendingInviteTeachers.length})</h2>
            <ul className="space-y-2">
              {pendingInviteTeachers.map(t => {
                const pendingId = t.id.replace('pending_', '');
                return (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-blue-900">{t.full_name}</p>
                      <p className="text-blue-600 text-xs">{t.email}</p>
                    </div>
                    <button
                      onClick={() => { removeOpenerRef.current = document.activeElement; setConfirmRemove({ ...t, pendingAssignmentId: pendingId }); }}
                      aria-label={`Cancel invitation for ${t.full_name || t.email}`}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Pending Deletion */}
        {pendingTeachers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pending Removal ({pendingTeachers.length})
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
            <p className="text-amber-700 text-xs mt-3">These accounts will be deleted after a 30-day grace period. Contact support to reactivate.</p>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="remove-dialog-title">
          <div ref={removeModalRef} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 id="remove-dialog-title" className="text-lg font-bold text-gray-900 mb-2">Remove Teacher?</h3>
            <p className="text-gray-600 text-sm mb-1"><strong>{confirmRemove.email}</strong> will lose access immediately.</p>
            <p className="text-gray-500 text-sm mb-5">They will receive an email notification. Their account will be deactivated right away.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmRemove(null)} disabled={removeLoading}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleRemoveTeacher(confirmRemove)} disabled={removeLoading}>
                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade/Change Plan Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-dialog-title">
          <div ref={upgradeModalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 id="upgrade-dialog-title" className="text-lg font-bold text-[#400070]">Change Plan</h2>
              <button onClick={() => setShowUpgrade(false)} aria-label="Close dialog"><X className="w-5 h-5 text-gray-400" aria-hidden="true" /></button>
            </div>

            <div className="p-6 space-y-3">
              {/* Plan Selection */}
              {!upgradePlan ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">Select a new plan. You will go through a new checkout — your current subscription will be canceled automatically.</p>
                  {PLANS.map(plan => {
                    const isCurrent = plan.name === district?.planName;
                    return (
                      <button
                        key={plan.key}
                        onClick={() => !isCurrent && handleUpgradeSelect(plan)}
                        disabled={isCurrent}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isCurrent
                            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                            : "border-[#D8CCE8] hover:border-[#400070] hover:bg-[#F7F3FA] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#400070]">{plan.name}</span>
                            {isCurrent && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                            <p className="text-xs text-gray-500 mt-0.5">{plan.minSeats === plan.maxSeats ? `${plan.minSeats} seat` : `${plan.minSeats}–${plan.maxSeats} seats`}</p>
                          </div>
                          <span className="font-bold text-gray-800">${plan.priceUSD}<span className="text-gray-400 font-normal text-xs">/seat/yr</span></span>
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <button onClick={() => setUpgradePlan(null)} className="text-sm text-[#400070] flex items-center gap-1 mb-2">
                    ← Back to plans
                  </button>

                  <div className="bg-[#F7F3FA] rounded-xl p-4 mb-2">
                    <p className="font-bold text-[#400070]">{upgradePlan.name} Plan</p>
                    <p className="text-sm text-gray-500">${upgradePlan.priceUSD}/seat/year · {upgradePlan.trialDays}-day trial</p>
                  </div>

                  {/* Seat selector */}
                  {upgradePlan.minSeats !== upgradePlan.maxSeats && (
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                        Number of Seats <span className="text-gray-400 font-normal">({upgradePlan.minSeats}–{upgradePlan.maxSeats})</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`Decrease licensed seats to ${upgradeSeats - 1}`} onClick={() => setUpgradeSeats(s => Math.max(upgradePlan.minSeats, s - 1))}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">−</button>
                        <span className="text-2xl font-bold text-[#400070] w-8 text-center" aria-live="polite" aria-label={`${upgradeSeats} seats`}>{upgradeSeats}</span>
                        <button type="button" aria-label={`Increase licensed seats to ${upgradeSeats + 1}`} onClick={() => setUpgradeSeats(s => Math.min(upgradePlan.maxSeats, s + 1))}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">+</button>
                        <span className="text-sm text-gray-500">=&nbsp;${(upgradePlan.priceUSD * upgradeSeats).toLocaleString()}/yr</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Your Email</label>
                    <Input
                      type="email"
                      value={upgradePurchaserEmail}
                      onChange={e => setUpgradePurchaserEmail(e.target.value)}
                      placeholder="you@district.org"
                    />
                  </div>

                  {upgradeError && <p className="text-red-600 text-sm" role="alert">{upgradeError}</p>}

                  <Button
                    onClick={handleUpgradeCheckout}
                    disabled={upgradeLoading}
                    className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 font-semibold"
                  >
                    {upgradeLoading ? "Redirecting to Checkout…" : `Start ${upgradePlan.trialDays}-Day Trial on ${upgradePlan.name}`}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">Your current subscription will be canceled. Secure checkout via Stripe.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}