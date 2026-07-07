import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ScreenFrame from "@/components/guide/ScreenFrame";
import PricingScreen from "@/components/guide/screens/PricingScreen";
import DashboardScreen from "@/components/guide/screens/DashboardScreen";
import AddTeacherScreen from "@/components/guide/screens/AddTeacherScreen";
import RosterScreen from "@/components/guide/screens/RosterScreen";
import InviteEmailScreen from "@/components/guide/screens/InviteEmailScreen";
import SignInScreen from "@/components/guide/screens/SignInScreen";

const PURPLE = "#400070";

function StepHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 mb-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: PURPLE }}>
        {number}
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: PURPLE }}>{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2 text-[13px] text-gray-700 leading-relaxed">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PURPLE }} />
      <span>{children}</span>
    </li>
  );
}

function PageFooter({ page }) {
  return (
    <div className="absolute bottom-6 left-12 right-12 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-3">
      <span>Modal Itinerant — Agency Onboarding Guide</span>
      <span>Page {page} of 5</span>
    </div>
  );
}

export default function AgencyOnboardingGuide() {
  const containerRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const pages = containerRef.current.querySelectorAll(".guide-page");
      const pdf = new jsPDF("p", "mm", "a4");
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true });
        const img = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        const w = 210;
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, "JPEG", 0, 0, w, Math.min(h, 297));
      }
      pdf.save("Modal-Itinerant-Agency-Onboarding-Guide.pdf");
    } finally {
      setGenerating(false);
    }
  };

  const pageStyle = { width: "794px", height: "1123px", position: "relative" };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Toolbar */}
      <div className="max-w-[794px] mx-auto mb-6 flex items-center justify-between px-2">
        <Link to="/DistrictManagerDashboard" className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: PURPLE }}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Button onClick={handleDownload} disabled={generating} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl">
          {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          {generating ? "Generating PDF…" : "Download PDF"}
        </Button>
      </div>

      <div ref={containerRef} className="mx-auto space-y-6" style={{ width: "794px" }}>
        {/* ---------- PAGE 1: COVER ---------- */}
        <div className="guide-page bg-white shadow-md overflow-hidden" style={pageStyle}>
          <div className="h-[420px] flex flex-col items-center justify-center text-center px-16" style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0060 55%, #400070 100%)" }}>
            <p className="text-white/70 text-sm font-bold tracking-[0.25em] uppercase mb-4">Modal Itinerant</p>
            <h1 className="text-white text-4xl font-bold leading-tight mb-4">Agency Onboarding Guide</h1>
            <p className="text-purple-200 text-base">A step-by-step guide for schools, districts &amp; agencies to set up their Modal Itinerant subscription and onboard their teachers.</p>
          </div>
          <div className="px-16 py-12">
            <h2 className="text-lg font-bold mb-5" style={{ color: PURPLE }}>What's inside</h2>
            <ol className="space-y-4">
              {[
                ["Choose your plan & start your free trial", "Pick the seat count that fits your team — every plan includes a 14-day free trial."],
                ["Access your District Manager Dashboard", "Your command center for licenses, billing, and your teacher roster."],
                ["Invite your teachers", "Add each teacher by name and email — they get everything they need automatically."],
                ["Teachers sign in & get started", "Each teacher receives a welcome email with a temporary password."],
                ["Manage your roster", "Resend invitations, remove teachers, and track seat usage anytime."],
              ].map(([t, d], i) => (
                <li key={t} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: PURPLE }}>{i + 1}</div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t}</p>
                    <p className="text-gray-500 text-[13px]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 bg-purple-50 border border-purple-100 rounded-xl p-5">
              <p className="text-[13px] text-gray-700"><strong style={{ color: PURPLE }}>Need help?</strong> Contact us anytime at <strong>support@modaleducation.com</strong> — we're happy to walk your team through setup.</p>
            </div>
          </div>
          <PageFooter page={1} />
        </div>

        {/* ---------- PAGE 2: STEP 1 ---------- */}
        <div className="guide-page bg-white shadow-md px-12 py-12 overflow-hidden" style={pageStyle}>
          <StepHeader number={1} title="Choose your plan & start your free trial" subtitle="On the pricing page, select the multi-seat plan that fits your team." />
          <ul className="space-y-2 mb-6 ml-14">
            <Bullet>Go to the <strong>Schools &amp; Districts</strong> pricing page and select <strong>Starter</strong> (2–5 seats), <strong>District</strong> (6–20 seats), or <strong>Program</strong> (21–50 seats).</Bullet>
            <Bullet>Choose the number of teacher seats you need — you can always upgrade later.</Bullet>
            <Bullet>Enter your email as the <strong>purchaser</strong>. This email becomes your District Manager account.</Bullet>
            <Bullet>Complete secure checkout via Stripe. <strong>You won't be charged until your 14-day free trial ends</strong>, and you can cancel anytime.</Bullet>
          </ul>
          <ScreenFrame url="modaleducation.com/DistrictPricing">
            <PricingScreen />
          </ScreenFrame>
          <div className="mt-6 ml-14 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[12px] text-amber-800"><strong>💡 Tip:</strong> Need board approval first? Use <strong>"Generate a Custom Quote"</strong> on the pricing page to get a branded PDF quote in seconds.</p>
          </div>
          <PageFooter page={2} />
        </div>

        {/* ---------- PAGE 3: STEPS 2 & 3 ---------- */}
        <div className="guide-page bg-white shadow-md px-12 py-12 overflow-hidden" style={pageStyle}>
          <StepHeader number={2} title="Access your District Manager Dashboard" subtitle="After checkout you land on your dashboard automatically." />
          <ul className="space-y-2 mb-4 ml-14">
            <Bullet>Right after purchase, you're taken to the <strong>District Manager Dashboard</strong> — your account is promoted to manager automatically.</Bullet>
            <Bullet>Here you can see your plan, trial status, seat usage, and manage billing.</Bullet>
          </ul>
          <div className="ml-14 mb-8" style={{ maxWidth: "540px" }}>
            <ScreenFrame url="modaleducation.com/DistrictManagerDashboard">
              <DashboardScreen />
            </ScreenFrame>
          </div>
          <StepHeader number={3} title="Invite your teachers" subtitle="Add each teacher with their name and school email." />
          <ul className="space-y-2 mb-4 ml-14">
            <Bullet>In the <strong>Add a Teacher</strong> card, enter the teacher's full name and school email, then click <strong>Invite Teacher</strong>.</Bullet>
            <Bullet>Each teacher automatically receives a welcome email with a temporary password — nothing else for you to do.</Bullet>
          </ul>
          <div className="ml-14" style={{ maxWidth: "480px" }}>
            <ScreenFrame url="modaleducation.com/DistrictManagerDashboard">
              <AddTeacherScreen />
            </ScreenFrame>
          </div>
          <PageFooter page={3} />
        </div>

        {/* ---------- PAGE 4: STEP 4 ---------- */}
        <div className="guide-page bg-white shadow-md px-12 py-12 overflow-hidden" style={pageStyle}>
          <StepHeader number={4} title="Teachers sign in & get started" subtitle="Each invited teacher receives everything they need by email." />
          <ul className="space-y-2 mb-5 ml-14">
            <Bullet>The welcome email includes a <strong>temporary password</strong> and a sign-in link.</Bullet>
            <Bullet>Teachers sign in with their school email, set their own password, and complete a short onboarding.</Bullet>
            <Bullet>Their license is applied automatically — <strong>no payment or trial setup needed on their end</strong>.</Bullet>
          </ul>
          <div className="ml-14 mb-6" style={{ maxWidth: "560px" }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">The welcome email teachers receive</p>
            <ScreenFrame url="Teacher's inbox">
              <InviteEmailScreen />
            </ScreenFrame>
          </div>
          <div className="ml-14" style={{ maxWidth: "560px" }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">The sign-in page</p>
            <ScreenFrame url="modaleducation.com/Join">
              <SignInScreen />
            </ScreenFrame>
          </div>
          <PageFooter page={4} />
        </div>

        {/* ---------- PAGE 5: STEP 5 + FAQ ---------- */}
        <div className="guide-page bg-white shadow-md px-12 py-12 overflow-hidden" style={pageStyle}>
          <StepHeader number={5} title="Manage your roster" subtitle="Track seats, resend invitations, and manage teachers anytime." />
          <ul className="space-y-2 mb-5 ml-14">
            <Bullet><strong>Pending Invitations</strong> shows teachers who haven't signed in yet — use the refresh icon to resend their welcome email.</Bullet>
            <Bullet>Remove a teacher anytime to free up their seat for someone else.</Bullet>
            <Bullet>Use <strong>Change Plan</strong> to add more seats as your program grows, or <strong>Manage Billing</strong> for invoices and payment details.</Bullet>
          </ul>
          <div className="ml-14 mb-8" style={{ maxWidth: "500px" }}>
            <ScreenFrame url="modaleducation.com/DistrictManagerDashboard">
              <RosterScreen />
            </ScreenFrame>
          </div>
          <h2 className="text-lg font-bold mb-4" style={{ color: PURPLE }}>Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              ["What if a teacher signs up before I invite them?", "No problem — their license is applied automatically the next time they sign in."],
              ["Can I change plans later?", "Yes. Use \"Change Plan\" on your dashboard to move between Starter, District, and Program at any time."],
              ["Is student data protected?", "Yes — the platform is designed for FERPA compliance, uses student initials only, and never stores identifying student information."],
            ].map(([q, a]) => (
              <div key={q} className="bg-gray-50 rounded-xl p-4">
                <p className="font-bold text-gray-800 text-[13px] mb-1">{q}</p>
                <p className="text-gray-600 text-[12px]">{a}</p>
              </div>
            ))}
          </div>
          <PageFooter page={5} />
        </div>
      </div>
    </div>
  );
}