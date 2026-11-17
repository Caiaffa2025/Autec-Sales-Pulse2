import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Client, GlobalFilters, Product, User } from '../types';
import { formatDateBR, formatDateTimeBR, OPPORTUNITY_STATUS_LABELS } from './formatters';

export interface ExportTableSection {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface ExportReportPayload {
  reportTitle: string;
  periodStart: string;
  periodEnd: string;
  filtersApplied: string;
  recordCount: number;
  kpis: Array<{ label: string; value: string }>;
  sections: ExportTableSection[];
  fileNameBase: string;
}

export interface SnapshotKpiCard {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'navy';
}

export interface SnapshotKpiGroup {
  title: string;
  badge?: string;
  cards: SnapshotKpiCard[];
}

export type SnapshotChartBlock =
  | {
      type: 'breakdown';
      title: string;
      items: Array<{ label: string; value: number; displayValue: string; color: string }>;
      emptyMessage?: string;
    }
  | {
      type: 'bars';
      title: string;
      items: Array<{ label: string; value: number; displayValue: string; secondary?: string; color?: string }>;
      emptyMessage?: string;
    }
  | {
      type: 'line';
      title: string;
      labels: string[];
      series: Array<{ name: string; color: string; values: number[] }>;
      emptyMessage?: string;
    };

export interface VisualSnapshotPayload {
  reportTitle: string;
  subtitle?: string;
  generatedBy?: string;
  periodStart: string;
  periodEnd: string;
  filtersApplied: string;
  recordSummary: string;
  kpiGroups: SnapshotKpiGroup[];
  charts: SnapshotChartBlock[];
  sections: ExportTableSection[];
  fileNameBase: string;
}

export function buildFiltersSummaryText(
  filters: GlobalFilters,
  users: User[],
  clients: Client[],
  products: Product[],
  extras: string[] = []
): string {
  const parts: string[] = [];
  if (filters.vendedorId) {
    const u = users.find((x) => x.id === filters.vendedorId);
    if (u) parts.push(`Vendedor: ${u.full_name}`);
  }
  if (filters.clienteId) {
    const c = clients.find((x) => x.id === filters.clienteId);
    if (c) parts.push(`Cliente: ${c.razao_social}`);
  }
  if (filters.produtoId) {
    const p = products.find((x) => x.id === filters.produtoId);
    if (p) parts.push(`Produto: ${p.nome_equipamento}`);
  }
  if (filters.situacao) {
    parts.push(`Situação: ${OPPORTUNITY_STATUS_LABELS[filters.situacao] || filters.situacao}`);
  }
  for (const ex of extras) {
    if (ex.trim()) parts.push(ex.trim());
  }
  return parts.length > 0 ? parts.join(' | ') : 'Todos os registros do período';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (![r, g, b].some(Number.isNaN)) return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) return [r, g, b];
  }
  return [27, 46, 94];
}

function getToneAccentRgb(tone?: SnapshotKpiCard['tone']): [number, number, number] {
  if (tone === 'positive') return [16, 185, 129]; // emerald-500
  if (tone === 'warning') return [245, 158, 11]; // amber-500
  if (tone === 'danger') return [239, 68, 68]; // red-500
  if (tone === 'navy') return [27, 46, 94]; // autec navy
  return [148, 163, 184]; // slate-400
}

function getToneValueRgb(tone?: SnapshotKpiCard['tone']): [number, number, number] {
  if (tone === 'positive') return [4, 120, 87]; // emerald-700
  if (tone === 'warning') return [180, 83, 9]; // amber-700
  if (tone === 'danger') return [185, 28, 28]; // red-700
  if (tone === 'navy') return [27, 46, 94];
  return [15, 23, 42]; // slate-900
}

function truncateTextToWidth(doc: jsPDF, text: string, maxWidthMm: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidthMm) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxWidthMm) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export function exportVisualSnapshotPDF(payload: VisualSnapshotPayload): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const marginX = 14;
  const contentW = pageW - marginX * 2; // 182mm
  const maxBodyY = pageH - 18;
  const generatedAt = formatDateTimeBR(new Date().toISOString());

  const ensureSpace = (neededMm: number, currentY: number): number => {
    if (currentY + neededMm > maxBodyY) {
      doc.addPage();
      return 16;
    }
    return currentY;
  };

  // Top Header Banner
  doc.setFillColor(27, 46, 94); // #1B2E5E
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(`Autec Sales Pulse — ${payload.reportTitle}`, marginX, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    payload.subtitle || 'Snapshot Visual de Indicadores Filtrados · Autec Equipamentos de Laboratório',
    marginX,
    18
  );
  doc.text(`Gerado em: ${generatedAt}`, pageW - marginX, 11.5, { align: 'right' });
  if (payload.generatedBy) {
    doc.text(`Emitido por: ${truncateTextToWidth(doc, payload.generatedBy, 65)}`, pageW - marginX, 18, {
      align: 'right',
    });
  }
  doc.setFontSize(8);
  doc.text(
    `Período: ${payload.periodStart ? formatDateBR(payload.periodStart) : 'Início'} a ${
      payload.periodEnd ? formatDateBR(payload.periodEnd) : 'Atual'
    }`,
    marginX,
    23.8
  );

  // Filter Traceability Card
  let y = 33;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const filterLines = doc.splitTextToSize(`Filtros ativos: ${payload.filtersApplied}`, contentW - 8) as string[];
  const scopeBoxH = 10 + filterLines.length * 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentW, scopeBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 46, 94);
  doc.text(`Escopo filtrado: ${payload.recordSummary}`, marginX + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(filterLines, marginX + 4, y + 10.2);

  y += scopeBoxH + 6;

  // Visual KPI Groups
  for (const group of payload.kpiGroups) {
    if (group.cards.length === 0) continue;
    y = ensureSpace(30, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(27, 46, 94);
    doc.text(group.title, marginX, y);
    if (group.badge) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(group.badge, pageW - marginX, y, { align: 'right' });
    }
    y += 3.5;

    const cols = 4;
    const gap = 3;
    const cardW = (contentW - gap * (cols - 1)) / cols; // ~43.25mm
    const cardH = 20.5;

    for (let i = 0; i < group.cards.length; i += cols) {
      y = ensureSpace(cardH + 3, y);
      const rowCards = group.cards.slice(i, i + cols);
      rowCards.forEach((card, cIdx) => {
        const cx = marginX + cIdx * (cardW + gap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, 'FD');

        // Top color stripe
        const [ar, ag, ab] = getToneAccentRgb(card.tone);
        doc.setFillColor(ar, ag, ab);
        doc.rect(cx, y, cardW, 1.2, 'F');

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(100, 116, 139);
        doc.text(truncateTextToWidth(doc, card.label, cardW - 5), cx + 2.5, y + 5.5);

        // Value
        const [vr, vg, vb] = getToneValueRgb(card.tone);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(vr, vg, vb);
        doc.text(truncateTextToWidth(doc, card.value, cardW - 5), cx + 2.5, y + 12.2);

        // Subtitle
        if (card.subtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.6);
          doc.setTextColor(100, 116, 139);
          doc.text(truncateTextToWidth(doc, card.subtitle, cardW - 5), cx + 2.5, y + 17.5);
        }
      });
      y += cardH + 3;
    }
    y += 3;
  }

  // Visual Charts
  for (const chart of payload.charts) {
    if (chart.type === 'breakdown') {
      const nonZero = chart.items.filter((it) => it.value > 0);
      const total = nonZero.reduce((acc, it) => acc + it.value, 0);
      const boxH = total === 0 ? 22 : 20 + nonZero.length * 7.5;
      y = ensureSpace(boxH + 4, y);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, y, contentW, boxH, 1.8, 1.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(27, 46, 94);
      doc.text(chart.title, marginX + 4, y + 6.5);

      if (total === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(chart.emptyMessage || 'Sem dados no período.', marginX + 4, y + 14.5);
        y += boxH + 5;
        continue;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total: ${total}`, pageW - marginX - 4, y + 6.5, { align: 'right' });

      // Segmented proportional bar
      const barX = marginX + 4;
      const barY = y + 9.5;
      const barW = contentW - 8;
      const barH = 4;
      let cursorX = barX;
      nonZero.forEach((slice, idx) => {
        const segW = idx === nonZero.length - 1 ? barX + barW - cursorX : (slice.value / total) * barW;
        const [r, g, b] = hexToRgb(slice.color);
        doc.setFillColor(r, g, b);
        if (segW > 0.2) {
          doc.rect(cursorX, barY, segW, barH, 'F');
        }
        cursorX += segW;
      });

      // Breakdown rows
      let ry = y + 18.5;
      nonZero.forEach((slice) => {
        const pct = ((slice.value / total) * 100).toFixed(1).replace('.', ',');
        const [r, g, b] = hexToRgb(slice.color);
        doc.setFillColor(r, g, b);
        doc.rect(marginX + 4, ry - 2.6, 2.8, 2.8, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(truncateTextToWidth(doc, slice.label, 90), marginX + 9, ry);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${slice.displayValue} (${pct}%)`, pageW - marginX - 4, ry, { align: 'right' });
        ry += 7;
      });

      y += boxH + 5;
    } else if (chart.type === 'bars') {
      const items = chart.items.slice(0, 10);
      const boxH = items.length === 0 ? 22 : 13 + items.length * 10.5;
      y = ensureSpace(boxH + 4, y);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, y, contentW, boxH, 1.8, 1.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(27, 46, 94);
      doc.text(chart.title, marginX + 4, y + 6.5);

      if (items.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(chart.emptyMessage || 'Sem registros no período selecionado.', marginX + 4, y + 14.5);
        y += boxH + 5;
        continue;
      }

      const maxVal = Math.max(...items.map((it) => it.value), 1);
      const trackW = contentW - 8;
      let by = y + 12.5;
      items.forEach((item) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(truncateTextToWidth(doc, item.label, trackW - 55), marginX + 4, by);

        const rightLabel = item.secondary ? `${item.displayValue} · ${item.secondary}` : item.displayValue;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(truncateTextToWidth(doc, rightLabel, 60), pageW - marginX - 4, by, { align: 'right' });

        // Track + fill bar
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(marginX + 4, by + 1.5, trackW, 2.8, 0.8, 0.8, 'F');
        const fillW = Math.max(2.5, (item.value / maxVal) * trackW);
        const [r, g, b] = hexToRgb(item.color || '#1B2E5E');
        doc.setFillColor(r, g, b);
        doc.roundedRect(marginX + 4, by + 1.5, fillW, 2.8, 0.8, 0.8, 'F');

        by += 10;
      });

      y += boxH + 5;
    } else if (chart.type === 'line') {
      const hasData =
        chart.labels.length > 0 &&
        chart.series.length > 0 &&
        !chart.series.every((s) => s.values.every((v) => v === 0));
      const boxH = hasData ? 64 : 22;
      y = ensureSpace(boxH + 4, y);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, y, contentW, boxH, 1.8, 1.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(27, 46, 94);
      doc.text(chart.title, marginX + 4, y + 6.5);

      if (!hasData) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(chart.emptyMessage || 'Sem dados suficientes para exibir a evolução temporal.', marginX + 4, y + 14.5);
        y += boxH + 5;
        continue;
      }

      // Legend top-right
      let lx = pageW - marginX - 4;
      [...chart.series].reverse().forEach((s) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const lw = doc.getTextWidth(s.name);
        lx -= lw;
        doc.setTextColor(71, 85, 105);
        doc.text(s.name, lx, y + 6.3);
        const [r, g, b] = hexToRgb(s.color);
        doc.setFillColor(r, g, b);
        doc.rect(lx - 4.5, y + 4.8, 3.2, 1.2, 'F');
        lx -= 9;
      });

      const plotX = marginX + 14;
      const plotY = y + 13;
      const plotW = contentW - 20;
      const plotH = 40;
      const allVals = chart.series.flatMap((s) => s.values);
      const maxVal = Math.max(...allVals, 1);

      const getX = (idx: number) =>
        chart.labels.length === 1 ? plotX + plotW / 2 : plotX + (idx / (chart.labels.length - 1)) * plotW;
      const getY = (val: number) => plotY + plotH - (val / maxVal) * plotH;

      // Grid lines
      [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
        const gy = plotY + plotH * (1 - t);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(plotX, gy, plotX + plotW, gy);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(String(Math.round(maxVal * t)), plotX - 2, gy + 1, { align: 'right' });
      });

      // X labels
      const step = chart.labels.length > 10 ? Math.ceil(chart.labels.length / 8) : 1;
      chart.labels.forEach((lbl, idx) => {
        if (idx % step !== 0 && idx !== chart.labels.length - 1) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(lbl, getX(idx), plotY + plotH + 5, { align: 'center' });
      });

      // Series lines + points
      chart.series.forEach((s) => {
        const [r, g, b] = hexToRgb(s.color);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.65);
        for (let i = 0; i < s.values.length - 1; i++) {
          doc.line(getX(i), getY(s.values[i]), getX(i + 1), getY(s.values[i + 1]));
        }
        s.values.forEach((v, i) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(0.5);
          doc.circle(getX(i), getY(v), 1.1, 'FD');
        });
      });

      y += boxH + 5;
    }
  }

  // Detailed Indicator Tables
  for (const sec of payload.sections) {
    y = ensureSpace(24, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(27, 46, 94);
    doc.text(sec.title, marginX, y);
    y += 3;

    if (sec.rows.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('Sem registros para esta seção com os filtros atuais.', marginX, y + 4);
      y += 10;
      continue;
    }

    autoTable(doc, {
      startY: y,
      head: [sec.columns],
      body: sec.rows.map((r) => r.map((cell) => String(cell))),
      theme: 'striped',
      headStyles: { fillColor: [27, 46, 94], textColor: [255, 255, 255], fontSize: 7.5, cellPadding: 2 },
      bodyStyles: { fontSize: 7.4, textColor: [31, 41, 55], cellPadding: 2, overflow: 'linebreak' },
      margin: { left: marginX, right: marginX, bottom: 18 },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 7;
  }

  // Page footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Autec Equipamentos de Laboratório · Desenvolvido por Agência STC Mobile`,
      marginX,
      pageH - 7.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
  }

  doc.save(`${payload.fileNameBase}.pdf`);
}

export function exportReportPDF(payload: ExportReportPayload): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const generatedAt = formatDateTimeBR(new Date().toISOString());

  // Header
  doc.setFillColor(27, 46, 94); // #1B2E5E
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Autec Sales Pulse — Relatório Gerencial', 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${payload.reportTitle} | Autec Equipamentos de Laboratório`, 14, 18);

  // Metadata box
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(8.5);
  let y = 33;
  doc.text(
    `Período analisado: ${payload.periodStart ? formatDateBR(payload.periodStart) : 'Início'} a ${payload.periodEnd ? formatDateBR(payload.periodEnd) : 'Atual'}`,
    14,
    y
  );
  doc.text(`Gerado em: ${generatedAt}`, 140, y);
  y += 5;
  doc.text(`Filtros aplicados: ${payload.filtersApplied || 'Todos os registros'}`, 14, y);
  doc.text(`Registros considerados: ${payload.recordCount}`, 140, y);
  y += 6;

  // KPIs
  if (payload.kpis.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [payload.kpis.map((k) => k.label)],
      body: [payload.kpis.map((k) => k.value)],
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [27, 46, 94], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { textColor: [17, 24, 39], fontSize: 9, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 8;
  }

  // Sections
  for (const sec of payload.sections) {
    if (y > 255) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(27, 46, 94);
    doc.text(sec.title, 14, y);
    y += 3;

    if (sec.rows.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('Sem registros para esta seção no período selecionado.', 14, y + 4);
      y += 10;
      continue;
    }

    autoTable(doc, {
      startY: y,
      head: [sec.columns],
      body: sec.rows.map((r) => r.map((cell) => String(cell))),
      theme: 'striped',
      headStyles: { fillColor: [27, 46, 94], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [31, 41, 55] },
      margin: { left: 14, right: 14 },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 8;
  }

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Autec Equipamentos de Laboratório · Desenvolvido por Agência STC Mobile · Página ${i} de ${totalPages}`,
      14,
      290
    );
  }

  doc.save(`${payload.fileNameBase}.pdf`);
}

export function exportReportExcel(payload: ExportReportPayload): void {
  const wb = XLSX.utils.book_new();
  const generatedAt = formatDateTimeBR(new Date().toISOString());

  // Summary sheet
  const summaryRows: Array<Array<string | number>> = [
    ['Autec Sales Pulse — Relatório Gerencial'],
    ['Relatório', payload.reportTitle],
    ['Empresa', 'Autec Equipamentos de Laboratório'],
    [
      'Período analisado',
      `${payload.periodStart ? formatDateBR(payload.periodStart) : 'Início'} a ${payload.periodEnd ? formatDateBR(payload.periodEnd) : 'Atual'}`,
    ],
    ['Data de geração', generatedAt],
    ['Filtros aplicados', payload.filtersApplied || 'Todos os registros'],
    ['Quantidade de registros considerados', payload.recordCount],
    [],
    ['Indicador', 'Valor'],
    ...payload.kpis.map((k) => [k.label, k.value]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  payload.sections.forEach((sec, idx) => {
    const sheetRows: Array<Array<string | number>> = [sec.columns, ...sec.rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetRows.length > 1 ? sheetRows : [sec.columns, ['Sem registros no período']]);
    const cleanName = sec.title.replace(/[\\/?*[\]:]/g, '').slice(0, 28) || `Secao_${idx + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, cleanName);
  });

  XLSX.writeFile(wb, `${payload.fileNameBase}.xlsx`);
}
