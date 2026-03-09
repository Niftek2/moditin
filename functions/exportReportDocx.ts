import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, Header, ShadingType } from 'npm:docx@9.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { reportData, sections, assessments, profile, logoBase64 } = body;

    const DISCLAIMER = 
      'Draft Evaluation Report – Teacher Review Required\n\n' +
      'This document was generated using a structured draft generator to assist Teachers of the Deaf and Hard of Hearing in preparing evaluation language.\n\n' +
      'All highlighted sections contain automatically generated or inserted content and must be reviewed, edited, and verified by the evaluating teacher before use in any official IEP documentation.\n\n' +
      'This tool does not replace professional judgment or district procedures.';

    const docChildren = [];

    // Helper: static text run
    const staticRun = (text, bold = false, size = 24) =>
      new TextRun({ text, bold, size, font: 'Calibri' });

    // Helper: highlighted (yellow) text run
    const highlightRun = (text, bold = false, size = 24) =>
      new TextRun({ text, bold, size, font: 'Calibri', highlight: 'yellow' });

    // Helper: static paragraph
    const staticPara = (text, heading = null, spacing = 200) => {
      const opts = { children: [staticRun(text)], spacing: { after: spacing } };
      if (heading) opts.heading = heading;
      return new Paragraph(opts);
    };

    // Helper: highlighted paragraph
    const highlightPara = (text, spacing = 200) =>
      new Paragraph({ children: [highlightRun(text)], spacing: { after: spacing } });

    // Helper: mixed paragraph (static label + highlighted value)
    const mixedPara = (label, value, spacing = 200) =>
      new Paragraph({
        children: [
          staticRun(label, true),
          highlightRun(value || ''),
        ],
        spacing: { after: spacing }
      });

    // Helper: section heading
    const sectionHeading = (text) =>
      new Paragraph({
        children: [staticRun(text, true, 28)],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        border: { bottom: { color: '400070', size: 6, style: 'single' } }
      });

    // ─── PAGE 1: COVER / CHECKLIST ───────────────────────────────────────────

    // Logo (if provided)
    if (logoBase64) {
      try {
        const logoData = logoBase64.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(logoData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        docChildren.push(new Paragraph({
          children: [new ImageRun({ data: bytes.buffer, transformation: { width: 150, height: 60 }, type: 'png' })],
          spacing: { after: 200 }
        }));
      } catch (e) {
        console.error('Logo insert error:', e);
      }
    }

    // Report title
    docChildren.push(new Paragraph({
      children: [staticRun('EDUCATIONAL EVALUATION REPORT', true, 32)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }));

    docChildren.push(new Paragraph({
      children: [staticRun('Teachers of the Deaf and Hard of Hearing', false, 22)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }));

    // Report metadata table
    const metaRows = [
      ['Report Type:', reportData.reportType],
      ['Student Initials:', reportData.studentInitials],
      ['Evaluator:', reportData.evaluatorName],
      ['Report Date:', reportData.reportDate],
      ['Evaluation Period:', `${reportData.evaluationStartDate || ''}${reportData.evaluationStartDate && reportData.evaluationCompletionDate ? ' – ' : ''}${reportData.evaluationCompletionDate || ''}`],
      ['Communication Mode:', reportData.communicationMode],
      ['Grade Level:', reportData.gradeLevel],
      ['Home Language:', reportData.homeLanguage],
    ].filter(([, val]) => val);

    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaRows.map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [staticRun(label, true, 22)] })]
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [highlightRun(value, false, 22)] })]
          })
        ]
      }))
    });
    docChildren.push(metaTable);
    docChildren.push(new Paragraph({ children: [], spacing: { after: 400 } }));

    // Assessments completed table
    if (assessments && assessments.length > 0) {
      docChildren.push(new Paragraph({
        children: [staticRun('Assessments Completed', true, 26)],
        spacing: { before: 200, after: 200 }
      }));

      const assessmentTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [staticRun('Assessment', true, 22)] })] }),
              new TableCell({ children: [new Paragraph({ children: [staticRun('Date', true, 22)] })] }),
            ]
          }),
          ...assessments.map(a => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [highlightRun(a.assessmentType, false, 22)] })] }),
              new TableCell({ children: [new Paragraph({ children: [highlightRun(a.assessmentDate || '', false, 22)] })] }),
            ]
          }))
        ]
      });
      docChildren.push(assessmentTable);
      docChildren.push(new Paragraph({ children: [], spacing: { after: 300 } }));
    }

    // Disclaimer box
    docChildren.push(new Paragraph({
      children: [staticRun('⚠ IMPORTANT DISCLAIMER', true, 22)],
      spacing: { before: 300, after: 100 },
      shading: { type: ShadingType.SOLID, color: 'FFF3CD' }
    }));
    DISCLAIMER.split('\n').forEach(line => {
      if (line.trim()) {
        docChildren.push(new Paragraph({
          children: [staticRun(line, line === DISCLAIMER.split('\n')[0], 20)],
          spacing: { after: 80 },
          shading: { type: ShadingType.SOLID, color: 'FFF3CD' }
        }));
      }
    });

    // Page break after cover
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // ─── BACKGROUND SECTION ─────────────────────────────────────────────────
    if (sections.background) {
      docChildren.push(sectionHeading('Background Information'));
      docChildren.push(highlightPara(sections.background, 300));
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ─── HEARING / AUDIOLOGY SECTION ────────────────────────────────────────
    if (sections.hearing) {
      docChildren.push(sectionHeading('Hearing and Auditory Access'));
      docChildren.push(highlightPara(sections.hearing, 300));
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ─── ASSESSMENT SECTIONS ─────────────────────────────────────────────────
    if (assessments && assessments.length > 0) {
      docChildren.push(sectionHeading('Assessment Results'));
      assessments.forEach(assessment => {
        docChildren.push(new Paragraph({
          children: [staticRun(assessment.assessmentType, true, 26)],
          spacing: { before: 300, after: 100 }
        }));
        if (assessment.assessmentDate) {
          docChildren.push(mixedPara('Date Administered: ', assessment.assessmentDate, 100));
        }
        if (assessment.generatedNarrative) {
          docChildren.push(highlightPara(assessment.generatedNarrative, 200));
        }
        if (assessment.customNarrative) {
          docChildren.push(highlightPara(assessment.customNarrative, 200));
        }
        docChildren.push(new Paragraph({ children: [], spacing: { after: 200 } }));
      });
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ─── PRESENT LEVELS ──────────────────────────────────────────────────────
    if (sections.presentLevels && Object.keys(sections.presentLevels).length > 0) {
      docChildren.push(sectionHeading('Present Levels of Performance'));
      Object.entries(sections.presentLevels).forEach(([area, text]) => {
        docChildren.push(new Paragraph({
          children: [staticRun(titleCase(area), true, 24)],
          spacing: { before: 200, after: 80 }
        }));
        docChildren.push(highlightPara(text, 200));
      });
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ─── ACCOMMODATIONS ──────────────────────────────────────────────────────
    if (sections.accommodations) {
      docChildren.push(sectionHeading('Accommodations and Access Supports'));
      const accLines = sections.accommodations.split('\n').filter(l => l.trim());
      accLines.forEach(line => {
        docChildren.push(new Paragraph({
          bullet: { level: 0 },
          children: [highlightRun(line)],
          spacing: { after: 100 }
        }));
      });
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ─── RECOMMENDATIONS ─────────────────────────────────────────────────────
    if (sections.recommendations) {
      docChildren.push(sectionHeading('Service Recommendations'));
      sections.recommendations.split('\n\n').forEach(block => {
        if (block.trim()) {
          docChildren.push(highlightPara(block.trim(), 200));
        }
      });
      docChildren.push(new Paragraph({ children: [], spacing: { after: 400 } }));
    }

    // ─── SIGNATURE BLOCK ─────────────────────────────────────────────────────
    if (profile?.signatureBlock || reportData.evaluatorName) {
      docChildren.push(sectionHeading('Evaluator Signature'));
      if (reportData.evaluatorName) {
        docChildren.push(mixedPara('Evaluating Teacher: ', reportData.evaluatorName, 200));
      }
      if (profile?.signatureBlock) {
        docChildren.push(new Paragraph({
          children: [staticRun(profile.signatureBlock)],
          spacing: { after: 200 }
        }));
      }
      docChildren.push(new Paragraph({
        children: [staticRun('Signature: _________________________________     Date: ________________')],
        spacing: { after: 200 }
      }));
    }

    // ─── BUILD DOCUMENT ──────────────────────────────────────────────────────
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: docChildren
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const bytes = new Uint8Array(buffer);

    // Encode as base64 so it can be returned as JSON and decoded on the frontend
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return Response.json({
      base64,
      filename: `DHH_Evaluation_${reportData.studentInitials || 'Report'}.docx`
    });

  } catch (error) {
    console.error('exportReportDocx error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}