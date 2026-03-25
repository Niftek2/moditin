import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Mail, Check, ChevronDown, ChevronUp, Building2 } from "lucide-react";

const DISTRICT_PLANS = [
  { key: "starter", name: "Starter", priceUSD: 225, priceCAD: 299, minSeats: 2, maxSeats: 5 },
  { key: "district", name: "District", priceUSD: 199, priceCAD: 272, minSeats: 6, maxSeats: 20 },
  { key: "program", name: "Program", priceUSD: 175, priceCAD: 238, minSeats: 21, maxSeats: 50 },
];

function getRecommendedPlan(seats) {
  if (seats <= 5) return DISTRICT_PLANS[0];
  if (seats <= 20) return DISTRICT_PLANS[1];
  return DISTRICT_PLANS[2];
}

function QuotePreview({ quoteData, currency }) {
  const isCAD = currency === "CAD";
  const { contactName, contactTitle, schoolName, schoolAddress, seats, plan, totalPrice, quoteDate, quoteNumber } = quoteData;

  return (
    <div id="quote-preview" className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#400070] to-[#6B2FB9] px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
              alt="Modal Education"
              className="h-12 w-auto mb-4"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <p className="text-white/70 text-sm font-medium">Modal Education</p>
            <p className="text-white/50 text-xs mt-0.5">www.modaleducation.com</p>
            <p className="text-white/50 text-xs">support@modaleducation.com</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Official Quote</p>
            <p className="text-white font-bold text-lg">#{quoteNumber}</p>
            <p className="text-white/60 text-xs mt-1">Issued: {quoteDate}</p>
            <p className="text-white/60 text-xs">Valid 30 days</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-7 space-y-6">
        {/* Bill To */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Prepared For</p>
            <p className="text-gray-900 font-bold">{contactName}</p>
            {contactTitle && <p className="text-gray-600 text-sm">{contactTitle}</p>}
            <p className="text-gray-700 text-sm font-medium mt-1">{schoolName}</p>
            {schoolAddress && <p className="text-gray-500 text-sm">{schoolAddress}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Summary</p>
            <p className="text-3xl font-bold text-[#400070]">
              {isCAD ? "CA$" : "$"}{totalPrice.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm">/year</p>
            <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              ✓ 14-day free trial included
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Line Items */}
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Line Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F3FA]">
                <th className="text-left px-4 py-2.5 text-[#400070] font-semibold rounded-l-lg">Description</th>
                <th className="text-center px-4 py-2.5 text-[#400070] font-semibold">Seats</th>
                <th className="text-center px-4 py-2.5 text-[#400070] font-semibold">Rate / Seat / Year</th>
                <th className="text-right px-4 py-2.5 text-[#400070] font-semibold rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-800 font-medium">
                  Modal Itinerant — {plan.name} Plan
                  <p className="text-xs text-gray-400 font-normal mt-0.5">Annual subscription, all features included</p>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{seats}</td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {isCAD ? "CA$" : "$"}{isCAD ? plan.priceCAD : plan.priceUSD}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {isCAD ? "CA$" : "$"}{totalPrice.toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-green-50/50">
                <td className="px-4 py-2.5 text-green-700 text-xs font-medium">14-Day Free Trial</td>
                <td className="px-4 py-2.5 text-center text-green-700 text-xs">{seats}</td>
                <td className="px-4 py-2.5 text-center text-green-700 text-xs">Complimentary</td>
                <td className="px-4 py-2.5 text-right text-green-700 text-xs font-bold">$0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 pt-4 text-right font-bold text-gray-700">Annual Total</td>
                <td className="px-4 pt-4 text-right text-xl font-bold text-[#400070]">
                  {isCAD ? "CA$" : "$"}{totalPrice.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Features Included */}
        <div className="bg-[#F7F3FA] rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-[#400070] font-semibold mb-3">What's Included</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              "Full access to Modal Itinerant for every licensed teacher",
              "AI-powered goal bank & lesson planner",
              "Service log, calendar & scheduling tools",
              "Listening checks & audiology tools",
              "Worksheet & activity generators",
              "District manager dashboard",
              "Centralized team management",
              "14-day free trial — no charge until trial ends",
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#400070] mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="border border-[#D8CDE5] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-1">Notes & Terms</p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>This quote is valid for 30 days from the issue date and is subject to review and written approval by Modal Education prior to becoming binding.</li>
            <li>All pricing, rates, and terms set forth in this quote are estimates only and are not guaranteed until a purchase order or subscription agreement is executed and confirmed in writing by an authorized representative of Modal Education. Modal Education reserves the right to modify, withdraw, or revise any quoted rates or terms at any time prior to such written confirmation.</li>
            <li>No payment is due until after the 14-day free trial period ends.</li>
            <li>Subscriptions renew annually unless cancelled before the renewal date.</li>
            <li>Purchase orders accepted. Contact contact@modaleducation.com for PO invoicing.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Questions? Contact us at <span className="text-[#400070] font-medium">contact@modaleducation.com</span>
          </p>
          <p className="text-xs text-gray-300 mt-1">Modal Education · www.modaleducation.com</p>
        </div>
      </div>
    </div>
  );
}

export default function QuoteGenerator({ defaultCurrency = "USD" }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [seats, setSeats] = useState(6);
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef(null);

  const isCAD = currency === "CAD";
  const plan = getRecommendedPlan(seats);
  const pricePerSeat = isCAD ? plan.priceCAD : plan.priceUSD;
  const totalPrice = pricePerSeat * seats;

  const today = new Date();
  const quoteDate = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const quoteNumber = `ME-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 900 + 100)}`;

  const quoteData = {
    contactName: contactName || "District Administrator",
    contactTitle,
    schoolName: schoolName || "Your School / District",
    schoolAddress,
    seats,
    plan,
    totalPrice,
    quoteDate,
    quoteNumber,
  };

  const handleGenerateQuote = () => {
    setError("");
    if (!contactName || !schoolName) {
      setError("Please enter your name and school/district name.");
      return;
    }
    setQuoteGenerated(true);
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleDownload = () => {
    const isCAD = currency === "CAD";
    const currencySymbol = isCAD ? "CA$" : "$";
    const { contactName, contactTitle, schoolName, schoolAddress, seats, plan, totalPrice, quoteDate, quoteNumber } = quoteData;
    const pricePerSeat = isCAD ? plan.priceCAD : plan.priceUSD;

    const features = [
      "Full access to Modal Itinerant for every licensed teacher",
      "AI-powered goal bank & lesson planner",
      "Service log, calendar & scheduling tools",
      "Listening checks & audiology tools",
      "Worksheet & activity generators",
      "District manager dashboard",
      "Centralized team management",
      "14-day free trial — no charge until trial ends",
    ];

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Quote ${quoteNumber} — ${schoolName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f1f8; padding: 32px 16px; color: #111827; }
    .page { background: #fff; max-width: 720px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #400070 0%, #6B2FB9 100%); padding: 36px 40px; }
    .header-inner { display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { height: 48px; display: block; margin-bottom: 12px; filter: brightness(0) invert(1); }
    .company-name { color: rgba(255,255,255,0.7); font-size: 13px; }
    .company-url { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 3px; }
    .quote-meta { text-align: right; }
    .quote-label { color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .quote-num { color: #fff; font-size: 22px; font-weight: 700; margin-top: 4px; }
    .quote-date { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .section-label { color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .prepared-row { display: flex; justify-content: space-between; margin-bottom: 28px; }
    .prepared-left { max-width: 55%; }
    .prepared-right { text-align: right; }
    .contact-name { font-size: 17px; font-weight: 700; }
    .contact-title { color: #6b7280; font-size: 13px; margin-top: 2px; }
    .school-name { font-size: 14px; font-weight: 600; color: #374151; margin-top: 5px; }
    .school-addr { color: #6b7280; font-size: 13px; margin-top: 2px; }
    .total-amount { color: #400070; font-size: 38px; font-weight: 800; }
    .total-sub { color: #9ca3af; font-size: 12px; margin-top: 2px; }
    .trial-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 8px; }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
    th { background: #f3e8ff; color: #400070; font-weight: 700; padding: 10px 14px; text-align: left; }
    th:nth-child(2), th:nth-child(3) { text-align: center; }
    th:last-child { text-align: right; }
    td { padding: 13px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    td:nth-child(2), td:nth-child(3) { text-align: center; }
    td:last-child { text-align: right; }
    .item-name { font-weight: 600; color: #111827; }
    .item-sub { color: #9ca3af; font-size: 11px; font-weight: 400; margin-top: 2px; }
    .trial-row td { background: #f0fdf4; color: #166534; font-size: 12px; }
    .total-row td { padding-top: 16px; border-bottom: none; }
    .total-label { text-align: right; font-weight: 700; color: #374151; font-size: 13px; }
    .total-value { text-align: right; font-size: 22px; font-weight: 800; color: #400070; }
    .features-box { background: #f9f5ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-top: 12px; }
    .feature-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #374151; }
    .check { color: #400070; font-weight: 700; }
    .terms-box { border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
    .terms-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; }
    .terms-list { padding-left: 16px; color: #6b7280; font-size: 11px; line-height: 1.9; }
    .footer { text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
    .footer-contact { font-size: 12px; color: #6b7280; }
    .footer-brand { font-size: 11px; color: #d1d5db; margin-top: 4px; }
    .purple { color: #400070; font-weight: 600; }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-inner">
        <div>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png" class="logo" alt="Modal Education" />
          <div class="company-name">Modal Education</div>
          <div class="company-url">www.modaleducation.com</div>
          <div class="company-url">contact@modaleducation.com</div>
        </div>
        <div class="quote-meta">
          <div class="quote-label">Official Quote</div>
          <div class="quote-num">#${quoteNumber}</div>
          <div class="quote-date">Issued: ${quoteDate}</div>
          <div class="quote-date">Valid for 30 days</div>
        </div>
      </div>
    </div>
    <div class="body">
      <div class="prepared-row">
        <div class="prepared-left">
          <div class="section-label">Prepared For</div>
          <div class="contact-name">${contactName}</div>
          ${contactTitle ? `<div class="contact-title">${contactTitle}</div>` : ""}
          <div class="school-name">${schoolName}</div>
          ${schoolAddress ? `<div class="school-addr">${schoolAddress}</div>` : ""}
        </div>
        <div class="prepared-right">
          <div class="section-label">Annual Total</div>
          <div class="total-amount">${currencySymbol}${totalPrice.toLocaleString()}</div>
          <div class="total-sub">${currency} / year</div>
          <div class="trial-badge">✓ 14-day free trial included</div>
        </div>
      </div>
      <hr class="divider" />
      <div class="section-label" style="margin-bottom:12px;">Line Items</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Seats</th>
            <th>Rate / Seat / Year</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="item-name">Modal Itinerant — ${plan.name} Plan</div><div class="item-sub">Annual subscription · All features included</div></td>
            <td>${seats}</td>
            <td>${currencySymbol}${pricePerSeat}</td>
            <td><strong>${currencySymbol}${totalPrice.toLocaleString()}</strong></td>
          </tr>
          <tr class="trial-row">
            <td>14-Day Free Trial</td>
            <td>${seats}</td>
            <td>Complimentary</td>
            <td><strong>$0.00</strong></td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3" class="total-label">Annual Total (${currency})</td>
            <td class="total-value">${currencySymbol}${totalPrice.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div class="features-box">
        <div class="section-label">What's Included</div>
        <div class="features-grid">
          ${features.map(f => `<div class="feature-item"><span class="check">✓</span><span>${f}</span></div>`).join("")}
        </div>
      </div>
      <div class="terms-box">
        <div class="terms-title">Notes &amp; Terms</div>
        <ul class="terms-list">
          <li>This quote is valid for 30 days from the issue date and is subject to review and written approval by Modal Education prior to becoming binding.</li>
          <li>All pricing, rates, and terms set forth in this quote are estimates only and are not guaranteed until a purchase order or subscription agreement is executed and confirmed in writing by an authorized representative of Modal Education. Modal Education reserves the right to modify, withdraw, or revise any quoted rates or terms at any time prior to such written confirmation.</li>
          <li>No payment is due until after the 14-day free trial period ends.</li>
          <li>Subscriptions renew annually unless cancelled before the renewal date.</li>
          <li>Purchase orders accepted — contact contact@modaleducation.com for PO invoicing.</li>
        </ul>
      </div>
      <div class="footer">
        <div class="footer-contact">Questions? <span class="purple">contact@modaleducation.com</span></div>
        <div class="footer-brand">Modal Education · www.modaleducation.com</div>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const handleSendEmail = async () => {
    setError("");
    if (!contactEmail || !contactEmail.includes("@")) {
      setError("Please enter a valid email address to send the quote to.");
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("sendQuoteEmail", {
        ...quoteData,
        contactEmail,
        currency,
        isCAD,
        pricePerSeat,
      });
      setEmailSent(true);
    } catch (e) {
      setError("Failed to send email. Please try again or download the quote.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-16 mb-8">
      {/* Section toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-6 py-5 text-white transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-base">Generate a Custom Quote</p>
            <p className="text-white/60 text-sm">Need board approval? Get a branded PDF quote in seconds.</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#EADDF5]" /> Quote Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">Your Name *</label>
                <Input
                  placeholder="e.g. Jane Smith"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">Your Title</label>
                <Input
                  placeholder="e.g. Director of Special Education"
                  value={contactTitle}
                  onChange={e => setContactTitle(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">School / District Name *</label>
                <Input
                  placeholder="e.g. Springfield USD"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">Address (optional)</label>
                <Input
                  placeholder="e.g. 123 Main St, Springfield, KS"
                  value={schoolAddress}
                  onChange={e => setSchoolAddress(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900"
                />
              </div>
            </div>

            {/* Seats + currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">Number of Teacher Seats</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSeats(s => Math.max(2, s - 1))}
                    className="w-10 h-10 rounded-xl bg-white/20 text-white font-bold text-xl hover:bg-white/30 transition-colors"
                  >−</button>
                  <span className="text-3xl font-bold text-white w-12 text-center">{seats}</span>
                  <button
                    type="button"
                    onClick={() => setSeats(s => Math.min(50, s + 1))}
                    className="w-10 h-10 rounded-xl bg-white/20 text-white font-bold text-xl hover:bg-white/30 transition-colors"
                  >+</button>
                </div>
              </div>
              <div>
                <label className="text-white/80 text-sm font-semibold mb-1.5 block">Currency</label>
                <div className="inline-flex items-center bg-white/10 rounded-full p-1 gap-1">
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
                  >🇺🇸 USD</button>
                  <button
                    onClick={() => setCurrency("CAD")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
                  >🇨🇦 CAD</button>
                </div>
              </div>
            </div>

            {/* Price preview */}
            <div className="bg-white/5 border border-white/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Recommended Plan</p>
                <p className="text-white font-bold">{plan.name} — {seats} seats</p>
                <p className="text-white/50 text-xs">{isCAD ? "CA$" : "$"}{pricePerSeat}/seat/year</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs mb-0.5">Annual Total</p>
                <p className="text-3xl font-bold text-white">{isCAD ? "CA$" : "$"}{totalPrice.toLocaleString()}</p>
              </div>
            </div>

            {error && !quoteGenerated && (
              <p className="text-red-300 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-2">{error}</p>
            )}

            <Button
              onClick={handleGenerateQuote}
              className="w-full bg-white text-[#400070] hover:bg-white/90 font-bold h-12 rounded-xl text-base"
            >
              <FileText className="w-4 h-4 mr-2" /> Generate Quote
            </Button>
          </div>

          {/* Quote Preview */}
          {quoteGenerated && (
            <div ref={previewRef} className="space-y-4">
              <QuotePreview quoteData={quoteData} currency={currency} />

              {/* Actions */}
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 space-y-4">
                <h4 className="text-white font-semibold text-sm">Send or Download Your Quote</h4>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download / Print PDF
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-white/80 text-sm font-semibold mb-1.5 block">
                      Email this quote to:
                    </label>
                    <Input
                      type="email"
                      placeholder="admin@district.org"
                      value={contactEmail}
                      onChange={e => { setContactEmail(e.target.value); setEmailSent(false); }}
                      className="bg-white/90 border-0 text-gray-900"
                    />
                  </div>
                  <Button
                    onClick={handleSendEmail}
                    disabled={sending || emailSent}
                    className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl font-semibold px-6 h-10 shrink-0"
                  >
                    {emailSent ? (
                      <><Check className="w-4 h-4 mr-2" /> Sent!</>
                    ) : sending ? (
                      "Sending…"
                    ) : (
                      <><Mail className="w-4 h-4 mr-2" /> Send Quote</>
                    )}
                  </Button>
                </div>

                {error && quoteGenerated && (
                  <p className="text-red-300 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-2">{error}</p>
                )}

                {emailSent && (
                  <p className="text-green-300 text-sm">✓ Quote sent to {contactEmail}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#quote-print-root) { display: none !important; }
          #quote-preview { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}