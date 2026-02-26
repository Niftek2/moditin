import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, studentId } = await req.json();

    const entries = await base44.asServiceRole.entities.ServiceEntry.filter({ monthKey: month });
    const filteredEntries = studentId ? entries.filter(e => e.studentId === studentId) : entries;

    const students = await base44.asServiceRole.entities.Student.list();
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s.studentInitials; });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginL = 18;
    const marginR = 18;
    const contentWidth = pageWidth - marginL - marginR;

    // ── Brand colors ──
    const purple = [64, 0, 112];       // #400070
    const purpleLight = [107, 47, 185]; // #6B2FB9
    const purplePale = [234, 221, 245]; // #EADDF5
    const textDark = [26, 16, 40];      // #1A1028
    const textMuted = [100, 90, 120];
    const white = [255, 255, 255];
    const borderGray = [216, 205, 229]; // --modal-border

    // ── Helper: safe ASCII bullet ──
    const bullet = '  |  ';

    // ── Month label ──
    const [year, mon] = month.split('-');
    const monthLabel = new Date(parseInt(year), parseInt(mon) - 1, 1)
      .toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // ════════════════════════════════════════════
    // HEADER BANNER
    // ════════════════════════════════════════════
    doc.setFillColor(...purple);
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Gradient accent strip
    doc.setFillColor(...purpleLight);
    doc.rect(0, 38, pageWidth, 4, 'F');

    // App name
    doc.setTextColor(...white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('MODAL', marginL, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Educator Platform', marginL, 18);

    // Report title (right-aligned in header)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Log Report', pageWidth - marginR, 15, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(210, 190, 240);
    doc.text(monthLabel, pageWidth - marginR, 22, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - marginR, 28, { align: 'right' });
    if (studentId && studentMap[studentId]) {
      doc.text(`Student: ${studentMap[studentId]}`, pageWidth - marginR, 34, { align: 'right' });
    }

    let yPos = 54;

    // ════════════════════════════════════════════
    // SUMMARY STATS CARDS
    // ════════════════════════════════════════════
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const directMinutes = filteredEntries.filter(e => e.category === 'DirectService').reduce((sum, e) => sum + (e.minutes || 0), 0);

    const categoryBreakdown = {};
    filteredEntries.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (e.minutes || 0);
    });

    const cards = [
      { label: 'Total Hours', value: totalHours },
      { label: 'Total Entries', value: String(filteredEntries.length) },
      { label: 'Direct Service', value: `${(directMinutes / 60).toFixed(1)}h` },
    ];

    const cardW = (contentWidth - 8) / 3;
    cards.forEach((card, i) => {
      const cx = marginL + i * (cardW + 4);
      // Card background
      doc.setFillColor(...purplePale);
      doc.roundedRect(cx, yPos, cardW, 22, 3, 3, 'F');
      // Left accent bar
      doc.setFillColor(...purple);
      doc.roundedRect(cx, yPos, 3, 22, 1.5, 1.5, 'F');
      // Value
      doc.setTextColor(...purple);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, cx + cardW / 2 + 2, yPos + 11, { align: 'center' });
      // Label
      doc.setTextColor(...textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label.toUpperCase(), cx + cardW / 2 + 2, yPos + 17, { align: 'center' });
    });

    yPos += 30;

    // ════════════════════════════════════════════
    // CATEGORY BREAKDOWN
    // ════════════════════════════════════════════
    doc.setTextColor(...purple);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('By Category', marginL, yPos);
    // Underline
    doc.setDrawColor(...purpleLight);
    doc.setLineWidth(0.5);
    doc.line(marginL, yPos + 1.5, marginL + 40, yPos + 1.5);
    yPos += 7;

    const cats = Object.entries(categoryBreakdown);
    const catColW = contentWidth / Math.min(cats.length, 3);

    cats.forEach(([cat, mins], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = marginL + col * catColW;
      const cy = yPos + row * 12;

      const label = cat.replace(/([A-Z])/g, ' $1').trim();
      const hrs = (mins / 60).toFixed(1);

      doc.setFillColor(...white);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, cy, catColW - 3, 10, 2, 2, 'FD');

      doc.setTextColor(...textDark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(label, cx + 4, cy + 5.5);

      doc.setTextColor(...purpleLight);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${hrs}h  (${mins}m)`, cx + catColW - 5, cy + 5.5, { align: 'right' });
    });

    const catRows = Math.ceil(cats.length / 3);
    yPos += catRows * 12 + 8;

    // ════════════════════════════════════════════
    // ENTRIES TABLE
    // ════════════════════════════════════════════
    doc.setTextColor(...purple);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Entries', marginL, yPos);
    doc.setDrawColor(...purpleLight);
    doc.setLineWidth(0.5);
    doc.line(marginL, yPos + 1.5, marginL + 50, yPos + 1.5);
    yPos += 7;

    // Table header
    doc.setFillColor(...purple);
    doc.rect(marginL, yPos, contentWidth, 7, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', marginL + 3, yPos + 4.8);
    doc.text('CATEGORY', marginL + 28, yPos + 4.8);
    doc.text('STUDENT', marginL + 68, yPos + 4.8);
    doc.text('METHOD', marginL + 100, yPos + 4.8);
    doc.text('DURATION', pageWidth - marginR - 3, yPos + 4.8, { align: 'right' });
    yPos += 7;

    // Sort entries by date
    const sorted = [...filteredEntries].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    sorted.forEach((entry, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 18;
        // Repeat mini header on new page
        doc.setFillColor(...purple);
        doc.rect(marginL, yPos, contentWidth, 7, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('DATE', marginL + 3, yPos + 4.8);
        doc.text('CATEGORY', marginL + 28, yPos + 4.8);
        doc.text('STUDENT', marginL + 68, yPos + 4.8);
        doc.text('METHOD', marginL + 100, yPos + 4.8);
        doc.text('DURATION', pageWidth - marginR - 3, yPos + 4.8, { align: 'right' });
        yPos += 7;
      }

      const rowH = entry.notes ? 12 : 8;
      // Alternating row bg
      if (idx % 2 === 0) {
        doc.setFillColor(247, 243, 250);
      } else {
        doc.setFillColor(...white);
      }
      doc.rect(marginL, yPos, contentWidth, rowH, 'F');

      // Left accent for category color
      doc.setFillColor(...purpleLight);
      doc.rect(marginL, yPos, 2, rowH, 'F');

      const catLabel = entry.category.replace(/([A-Z])/g, ' $1').trim();
      const dateStr = entry.date ? entry.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') : '';
      const studentLabel = entry.studentId ? (studentMap[entry.studentId] || '') : '';
      const methodLabel = entry.entryMethod || '';
      const mins = entry.minutes || 0;
      const durationLabel = mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;

      doc.setTextColor(...textDark);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(dateStr, marginL + 3, yPos + 5.2);

      doc.setFont('helvetica', 'bold');
      doc.text(catLabel, marginL + 28, yPos + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(studentLabel, marginL + 68, yPos + 5.2);
      doc.text(methodLabel, marginL + 100, yPos + 5.2);

      doc.setTextColor(...purple);
      doc.setFont('helvetica', 'bold');
      doc.text(durationLabel, pageWidth - marginR - 3, yPos + 5.2, { align: 'right' });

      if (entry.notes) {
        doc.setTextColor(...textMuted);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        const noteLines = doc.splitTextToSize(entry.notes, contentWidth - 10);
        doc.text(noteLines[0] + (noteLines.length > 1 ? '...' : ''), marginL + 5, yPos + 9.5);
      }

      // Row bottom border
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.line(marginL, yPos + rowH, marginL + contentWidth, yPos + rowH);

      yPos += rowH;
    });

    // ════════════════════════════════════════════
    // FOOTER on each page
    // ════════════════════════════════════════════
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...purplePale);
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      doc.setFillColor(...purple);
      doc.rect(0, pageHeight - 10, pageWidth, 1, 'F');
      doc.setTextColor(...textMuted);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Modal Educator Platform  |  Confidential  |  Not for diagnostic use', marginL, pageHeight - 4);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginR, pageHeight - 4, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=service-log-${month}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});