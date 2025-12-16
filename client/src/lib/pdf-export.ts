import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  isAdmin: boolean;
}

interface KPI {
  label: string;
  value: string;
  subtext?: string;
}

interface AdminReportData extends ReportData {
  kpis: {
    totalAUM: string;
    interestSaved: string;
    avgRate: string;
    activeLoans: number;
    usersWithLoans: number;
  };
  bankDistribution: Array<{ name: string; value: string; percentage: string }>;
  negotiationStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    successRate: string;
    avgReduction: string;
  };
}

interface UserReportData extends ReportData {
  lifetimeSavings: {
    interestSaved: string;
    totalPrepayments: string;
    monthsSaved: number;
    completion: string;
  };
  periodData: {
    period: string;
    prepayments: string;
    interestSaved: string;
    tenureReduced: number;
  };
  aiSummary?: string;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  text: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  background: "#f9fafb",
};

function addHeader(doc: jsPDF, title: string, subtitle: string, yPos: number): number {
  // Logo/Brand
  doc.setFillColor(59, 130, 246); // Primary blue
  doc.rect(20, yPos, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text("Interex", 32, yPos + 6);
  
  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, yPos + 25);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(subtitle, 20, yPos + 33);
  
  // Date
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr}`, 20, yPos + 42);
  
  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, yPos + 48, 190, yPos + 48);
  
  return yPos + 55;
}

function addKPICard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  subtext?: string,
  color: string = COLORS.primary
): void {
  // Card background
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(x, y, width, 35, 3, 3, "F");
  
  // Left accent
  doc.setFillColor(color);
  doc.rect(x, y + 5, 3, 25, "F");
  
  // Label
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(label, x + 8, y + 12);
  
  // Value
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(value, x + 8, y + 24);
  
  // Subtext
  if (subtext) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(subtext, x + 8, y + 31);
  }
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(title, 20, y);
  return y + 8;
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const pageHeight = doc.internal.pageSize.height;
  
  // Footer line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 15, 190, pageHeight - 15);
  
  // Footer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Interex - Smart Home Loan Management", 20, pageHeight - 8);
  doc.text(`Page ${pageNum} of ${totalPages}`, 170, pageHeight - 8);
}

export async function exportAdminReportPDF(
  data: AdminReportData,
  chartElementId?: string
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;
  
  let y = 15;
  
  // Header
  y = addHeader(doc, "Platform Analytics Report", "Aggregated platform metrics and performance insights", y);
  
  // Admin badge
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(160, 20, 30, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Admin View", 165, 25);
  
  // KPI Section
  y = addSectionTitle(doc, "Key Performance Indicators", y);
  y += 5;
  
  const kpiWidth = 40;
  const kpiGap = 3;
  addKPICard(doc, 20, y, kpiWidth, "Total AUM", data.kpis.totalAUM, undefined, COLORS.primary);
  addKPICard(doc, 20 + kpiWidth + kpiGap, y, kpiWidth, "Interest Saved", data.kpis.interestSaved, undefined, COLORS.success);
  addKPICard(doc, 20 + (kpiWidth + kpiGap) * 2, y, kpiWidth, "Avg Loan Rate", data.kpis.avgRate, undefined, COLORS.warning);
  addKPICard(doc, 20 + (kpiWidth + kpiGap) * 3, y, kpiWidth, "Active Loans", String(data.kpis.activeLoans), `${data.kpis.usersWithLoans} users`, COLORS.purple);
  
  y += 45;
  
  // Bank Distribution Section
  y = addSectionTitle(doc, "Loan Distribution by Bank", y);
  y += 5;
  
  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(20, y, 170, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Bank Name", 25, y + 5.5);
  doc.text("Outstanding Value", 100, y + 5.5);
  doc.text("Share", 165, y + 5.5);
  y += 8;
  
  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  data.bankDistribution.forEach((bank, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, y, 170, 7, "F");
    }
    doc.setFontSize(9);
    doc.text(bank.name, 25, y + 5);
    doc.text(bank.value, 100, y + 5);
    doc.text(bank.percentage, 165, y + 5);
    y += 7;
  });
  
  y += 10;
  
  // Negotiation Performance Section
  y = addSectionTitle(doc, "Negotiation Performance Summary", y);
  y += 5;
  
  // Stats boxes
  const statsWidth = 55;
  const statsGap = 2.5;
  
  // Total Processed
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(20, y, statsWidth, 25, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Total Processed", 25, y + 8);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(String(data.negotiationStats.total), 25, y + 19);
  
  // Success Rate
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20 + statsWidth + statsGap, y, statsWidth, 25, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Success Rate", 25 + statsWidth + statsGap, y + 8);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(data.negotiationStats.successRate, 25 + statsWidth + statsGap, y + 19);
  
  // Avg Reduction
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(20 + (statsWidth + statsGap) * 2, y, statsWidth, 25, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Avg Rate Reduction", 25 + (statsWidth + statsGap) * 2, y + 8);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text(data.negotiationStats.avgReduction, 25 + (statsWidth + statsGap) * 2, y + 19);
  
  y += 35;
  
  // Status breakdown
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text("Status Breakdown:", 20, y);
  y += 8;
  
  // Approved
  doc.setFillColor(16, 185, 129);
  doc.circle(25, y - 1.5, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text(`Approved: ${data.negotiationStats.approved}`, 30, y);
  
  // Rejected
  doc.setFillColor(239, 68, 68);
  doc.circle(85, y - 1.5, 2, "F");
  doc.text(`Rejected: ${data.negotiationStats.rejected}`, 90, y);
  
  // Pending
  doc.setFillColor(245, 158, 11);
  doc.circle(145, y - 1.5, 2, "F");
  doc.text(`Pending: ${data.negotiationStats.pending}`, 150, y);
  
  // Try to capture charts if element exists
  if (chartElementId) {
    const chartElement = document.getElementById(chartElementId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        doc.addPage();
        y = 20;
        y = addSectionTitle(doc, "Visual Analytics", y);
        y += 5;
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", 20, y, imgWidth, Math.min(imgHeight, 200));
      } catch (error) {
        console.error("Error capturing charts:", error);
      }
    }
  }
  
  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  // Download
  doc.save(`Interex_Admin_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportUserReportPDF(
  data: UserReportData,
  chartElementId?: string
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  
  let y = 15;
  
  // Header
  y = addHeader(doc, "Savings Report", "Track your home loan savings journey", y);
  
  // Lifetime Savings Section
  y = addSectionTitle(doc, "Lifetime Savings", y);
  y += 5;
  
  const kpiWidth = 40;
  const kpiGap = 3;
  addKPICard(doc, 20, y, kpiWidth, "Interest Saved", data.lifetimeSavings.interestSaved, undefined, COLORS.success);
  addKPICard(doc, 20 + kpiWidth + kpiGap, y, kpiWidth, "Total Prepayments", data.lifetimeSavings.totalPrepayments, undefined, COLORS.primary);
  addKPICard(doc, 20 + (kpiWidth + kpiGap) * 2, y, kpiWidth, "Months Saved", String(data.lifetimeSavings.monthsSaved), undefined, COLORS.purple);
  addKPICard(doc, 20 + (kpiWidth + kpiGap) * 3, y, kpiWidth, "Loan Completed", data.lifetimeSavings.completion, undefined, COLORS.warning);
  
  y += 50;
  
  // Period Summary Section
  y = addSectionTitle(doc, `${data.periodData.period} Summary`, y);
  y += 5;
  
  // Summary box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y, 170, 40, 3, 3, "F");
  
  // Period stats
  const colWidth = 55;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Total Prepayments", 30, y + 12);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text(data.periodData.prepayments, 30, y + 24);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Interest Saved", 30 + colWidth, y + 12);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(data.periodData.interestSaved, 30 + colWidth, y + 24);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Tenure Reduced", 30 + colWidth * 2, y + 12);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text(`${data.periodData.tenureReduced} months`, 30 + colWidth * 2, y + 24);
  
  y += 50;
  
  // AI Summary Section
  if (data.aiSummary) {
    y = addSectionTitle(doc, "AI Summary", y);
    y += 5;
    
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(20, y, 170, 25, 3, 3, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    
    // Wrap text
    const lines = doc.splitTextToSize(data.aiSummary, 160);
    doc.text(lines, 25, y + 10);
    
    y += 35;
  }
  
  // Try to capture charts if element exists
  if (chartElementId) {
    const chartElement = document.getElementById(chartElementId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        y = addSectionTitle(doc, "Visual Analytics", y);
        y += 5;
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page
        if (y + imgHeight > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.addImage(imgData, "PNG", 20, y, imgWidth, Math.min(imgHeight, 150));
      } catch (error) {
        console.error("Error capturing charts:", error);
      }
    }
  }
  
  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  // Download
  doc.save(`Interex_Savings_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

