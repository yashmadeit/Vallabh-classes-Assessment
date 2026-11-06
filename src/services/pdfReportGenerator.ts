import { jsPDF } from 'jspdf';
import { TestEvaluationResult } from '../types/assessment';

/**
 * Sanitizes Unicode characters (mathematical superscripts, symbols, dashes, bullets)
 * into safe ASCII equivalents compatible with standard jsPDF fonts (Helvetica).
 */
export function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/–/g, '-') // en-dash
    .replace(/—/g, ' - ') // em-dash
    .replace(/·/g, '|') // middle dot
    .replace(/•/g, '-') // bullet
    .replace(/≥/g, '>=') // greater than or equal
    .replace(/≤/g, '<=') // less than or equal
    .replace(/≠/g, '!=') // not equal
    .replace(/±/g, '+/-') // plus-minus
    .replace(/²/g, '^2') // squared
    .replace(/³/g, '^3') // cubed
    .replace(/⁴/g, '^4') // 4th power
    .replace(/⁵/g, '^5') // 5th power
    .replace(/ⁿ/g, '^n') // nth power
    .replace(/√/g, 'sqrt') // square root
    .replace(/α/g, 'alpha')
    .replace(/β/g, 'beta')
    .replace(/θ/g, 'theta')
    .replace(/π/g, 'pi')
    .replace(/[^\x00-\x7F]/g, ''); // strip any remaining non-ASCII characters
}

export function generatePdfReport(result: TestEvaluationResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Professional Palette: Navy & Teal
  const navy = [15, 23, 42]; // #0f172a
  const teal = [13, 148, 136]; // #0d9488
  const darkSlate = [51, 65, 85]; // #334155
  const lightGrey = [248, 250, 252]; // #f8fafc
  const borderGrey = [203, 213, 225]; // #cbd5e1

  // ==========================================
  // PAGE 1: EXECUTIVE DIAGNOSTIC SUMMARY
  // ==========================================
  let y = 16;

  // Header Bar
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('VALLABH CLASSES', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 246, 228); // light teal
  doc.text('Maths Assessment & Diagnostic Report | Class 10 CBSE', margin + 6, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Hemang Shah Sir (30 Yrs Exp.)', pageWidth - margin - 6, y + 8, { align: 'right' });
  doc.text('Harni-Sama Link Road, Vadodara | 9824076529', pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 28;

  // Student Info Box
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(margin, y, contentWidth, 19, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Student: ${sanitizeForPdf(result.student.name)}`, margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`Class: Class 10 | Board: CBSE`, margin + 5, y + 13.5);

  const dateStr = new Date(result.submittedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 5, y + 7, { align: 'right' });
  doc.text(`Report ID: ${result.resultId}`, pageWidth - margin - 5, y + 13.5, { align: 'right' });

  y += 25;

  // Score Summary KPI Grid (4 blocks)
  const kpiWidth = (contentWidth - 9) / 4;
  const kpiHeight = 18;

  const kpis = [
    { label: 'Overall Score', val: `${result.overallScore} / ${result.totalQuestions}`, sub: `${result.correctCount} correct` },
    { label: 'Overall Test Accuracy', val: `${result.overallAccuracyPercent}%`, sub: 'of all 20 questions' },
    { label: 'Attempted Accuracy', val: `${result.attemptedAccuracyPercent}%`, sub: `on ${result.attemptedCount} attempted` },
    {
      label: 'Time Taken',
      val: `${Math.floor(result.timeSpentSeconds / 60)}m ${result.timeSpentSeconds % 60}s`,
      sub: 'of 25 mins allowed',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
    doc.roundedRect(kpiX, y, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + kpiWidth / 2, y + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(kpi.val, kpiX + kpiWidth / 2, y + 10.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, kpiX + kpiWidth / 2, y + 15, { align: 'center' });
  });

  y += 24;

  // Chapter-wise Performance Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('Chapter-wise Performance Breakdown', margin, y);

  y += 4;

  // Table Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('Chapter', margin + 3, y + 5);
  doc.text('Total', margin + 70, y + 5);
  doc.text('Attempted', margin + 86, y + 5);
  doc.text('Correct', margin + 106, y + 5);
  doc.text('Accuracy', margin + 126, y + 5);
  doc.text('Diagnostic Status', margin + 148, y + 5);

  y += 7;

  // Table Rows
  result.chapterBreakdown.forEach((ch, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(sanitizeForPdf(ch.chapterTitle), margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(ch.totalQuestions.toString(), margin + 73, y + 5);
    doc.text(ch.attemptedQuestions.toString(), margin + 91, y + 5);
    doc.text(ch.correctAnswers.toString(), margin + 110, y + 5);
    doc.text(`${ch.attemptedChapterAccuracy}%`, margin + 129, y + 5);

    // Status styling
    if (ch.performanceStatus === 'Strong') {
      doc.setTextColor(13, 148, 136); // teal
      doc.setFont('helvetica', 'bold');
      doc.text('Strong (>=70%)', margin + 148, y + 5);
    } else if (ch.performanceStatus === 'Needs Revision') {
      doc.setTextColor(220, 38, 38); // red
      doc.setFont('helvetica', 'bold');
      doc.text('Needs Revision', margin + 148, y + 5);
    } else {
      doc.setTextColor(180, 83, 9); // amber
      doc.setFont('helvetica', 'bold');
      doc.text('Limited Data (<3)', margin + 148, y + 5);
    }

    y += 7;
  });

  y += 6;

  // Recommendations & Focus Area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('Targeted Revision Recommendations', margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

  result.specificRecommendations.forEach((rec) => {
    const cleanRec = sanitizeForPdf(rec);
    const splitRec = doc.splitTextToSize(`- ${cleanRec}`, contentWidth - 4);
    doc.text(splitRec, margin + 2, y);
    y += splitRec.length * 4;
  });

  y += 4;

  // Teacher Feedback Section (Authorised Manual Entry Only)
  doc.setDrawColor(teal[0], teal[1], teal[2]);
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('Teacher Feedback & Remarks (Hemang Shah Sir)', margin + 5, y + 6);

  if (result.teacherFeedback && result.teacherFeedback.remarks.trim()) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    const cleanRemarks = sanitizeForPdf(result.teacherFeedback.remarks);
    const splitRemarks = doc.splitTextToSize(`"${cleanRemarks}"`, contentWidth - 10);
    doc.text(splitRemarks, margin + 5, y + 12);

    if (result.teacherFeedback.recommendedFocus) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(
        `Recommended Focus: ${sanitizeForPdf(result.teacherFeedback.recommendedFocus)}`,
        margin + 5,
        y + 22
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.text(
      `Verified & Signed by Hemang Shah Sir | ${sanitizeForPdf(result.teacherFeedback.updatedAt)}`,
      margin + 5,
      y + 28
    );
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(
      'Official Educator Review: Awaiting in-person review at Vallabh Classes or telephonic consultation.',
      margin + 5,
      y + 12
    );
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Students and parents are welcome to visit our Harni-Sama Link Road classroom with this report.',
      margin + 5,
      y + 18
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.text('Direct Helpline to Hemang Shah Sir: 9824076529', margin + 5, y + 26);
  }

  // Footer for Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Vallabh Classes | Harni-Sama Link Road, Vadodara | Page 1 of 2',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // ==========================================
  // PAGE 2: QUESTION-WISE SOLUTIONS SUMMARY
  // ==========================================
  doc.addPage();
  let y2 = 16;

  // Header Bar Page 2
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y2, contentWidth, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('VALLABH CLASSES - DETAILED QUESTION AUDIT', margin + 6, y2 + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 246, 228);
  doc.text(`Student: ${sanitizeForPdf(result.student.name)} | Class 10 CBSE | Report ID: ${result.resultId}`, margin + 6, y2 + 11);

  y2 += 18;

  // Question Table Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y2, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('Q#', margin + 2, y2 + 4.5);
  doc.text('Chapter & Topic', margin + 12, y2 + 4.5);
  doc.text('Your Ans', margin + 105, y2 + 4.5);
  doc.text('Correct', margin + 124, y2 + 4.5);
  doc.text('Result', margin + 144, y2 + 4.5);

  y2 += 6;

  // Question Rows
  result.questionReviews.forEach((qRev, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y2, contentWidth, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y2 + 8, margin + contentWidth, y2 + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`Q${qRev.questionNumber}`, margin + 2, y2 + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    const chapterTopicText = sanitizeForPdf(`${qRev.question.chapterTitle} - ${qRev.question.topic}`);
    doc.text(chapterTopicText.substring(0, 52), margin + 12, y2 + 5.5);

    // Student Answer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (qRev.isAttempted) {
      doc.setTextColor(qRev.isCorrect ? 13 : 220, qRev.isCorrect ? 148 : 38, qRev.isCorrect ? 136 : 38);
      doc.text(`Option ${qRev.studentAnswer}`, margin + 107, y2 + 5.5);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('Skipped', margin + 107, y2 + 5.5);
    }

    // Correct Answer
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`Option ${qRev.correctOption}`, margin + 126, y2 + 5.5);

    // Status Tag
    if (qRev.isCorrect) {
      doc.setTextColor(13, 148, 136); // teal
      doc.text('CORRECT', margin + 144, y2 + 5.5);
    } else if (qRev.isAttempted) {
      doc.setTextColor(220, 38, 38); // red
      doc.text('INCORRECT', margin + 144, y2 + 5.5);
    } else {
      doc.setTextColor(100, 116, 139); // slate
      doc.text('UNATTEMPTED', margin + 144, y2 + 5.5);
    }

    y2 += 8;
  });

  // Footer for Page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Vallabh Classes | Harni-Sama Link Road, Vadodara | Page 2 of 2',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // Trigger download
  const cleanName = result.student.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Vallabh_Classes_Maths_Assessment_${cleanName}.pdf`);
}
