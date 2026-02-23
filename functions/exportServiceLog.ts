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

    // Fetch service entries for the month
    const entries = await base44.asServiceRole.entities.ServiceEntry.filter({ monthKey: month });
    const filteredEntries = studentId ? entries.filter(e => e.studentId === studentId) : entries;

    // Fetch student data for labels
    const students = await base44.asServiceRole.entities.Student.list();
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s.studentInitials; });

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Service Log Report', 20, yPos);
    yPos += 10;

    // Header info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Month: ${month}`, 20, yPos);
    yPos += 5;
    if (studentId) {
      doc.text(`Student: ${studentMap[studentId] || 'Unknown'}`, 20, yPos);
      yPos += 5;
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 10;

    // Summary stats
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);
    const categoryBreakdown = {};
    filteredEntries.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (e.minutes || 0);
    });

    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Total Hours: ${(totalMinutes / 60).toFixed(1)}`, 20, yPos);
    yPos += 5;
    doc.text(`Total Entries: ${filteredEntries.length}`, 20, yPos);
    yPos += 8;

    // Category breakdown
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('By Category:', 20, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    Object.entries(categoryBreakdown).forEach(([cat, mins]) => {
      const label = cat.replace(/([A-Z])/g, ' $1').trim();
      doc.text(`${label}: ${mins} minutes`, 25, yPos);
      yPos += 4;
    });
    yPos += 5;

    // Entry details
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Entries', 20, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    filteredEntries.forEach(entry => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      const catLabel = entry.category.replace(/([A-Z])/g, ' $1').trim();
      const dateStr = entry.date || '';
      const studentLabel = entry.studentId ? ` · ${studentMap[entry.studentId] || ''}` : '';

      doc.setFont(undefined, 'bold');
      doc.text(`${catLabel} · ${entry.minutes} min`, 20, yPos);
      yPos += 4;

      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`${dateStr}${studentLabel}${entry.entryMethod ? ` · ${entry.entryMethod}` : ''}`, 25, yPos);
      doc.setTextColor(0);
      yPos += 4;

      if (entry.notes) {
        const noteLines = doc.splitTextToSize(entry.notes, pageWidth - 50);
        doc.setFontSize(7);
        noteLines.forEach(line => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 25, yPos);
          yPos += 3;
        });
        doc.setFontSize(8);
      }

      yPos += 3;
    });

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