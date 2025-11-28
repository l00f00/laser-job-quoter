import { saveAs } from 'file-saver';
import type { Quote, PricePackage } from '@shared/types';
export function exportQuoteCSV(quote: Quote) {
  const estimate = quote.estimate as PricePackage | undefined;
  if (!estimate?.breakdown) {
    alert('Cannot export quote without a price breakdown.');
    return;
  }
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Item,Value\r\n';
  csvContent += `Quote Title,${quote.title}\r\n`;
  csvContent += `Material ID,${quote.materialId}\r\n`;
  csvContent += `Thickness (mm),${quote.thicknessMm}\r\n`;
  csvContent += `Job Type,${quote.jobType}\r\n`;
  csvContent += `Total Price,${estimate.total}\r\n`;
  csvContent += '\r\n';
  csvContent += 'Price Breakdown\r\n';
  for (const [key, value] of Object.entries(estimate.breakdown)) {
    csvContent += `${key},${value}\r\n`;
  }
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `luxquote_${quote.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
export function exportQuotePDF(quote: Quote) {
  const estimate = quote.estimate as PricePackage | undefined;
  if (!estimate) {
    alert('Cannot export quote without an estimate.');
    return;
  }
  const breakdownHtml = Object.entries(estimate.breakdown ?? {})
    .map(([key, value]) => `<tr><td>${key}</td><td style="text-align: right;">${(value as number).toFixed(2)}</td></tr>`)
    .join('');
  const thumbnailHtml = quote.thumbnail
    ? `<img src="${quote.thumbnail}" style="max-width: 200px; max-height: 200px; border: 1px solid #eee; margin-top: 20px;" alt="Thumbnail"/>`
    : '';
  const htmlContent = `
    <html>
      <head>
        <title>Quote ${quote.id}</title>
        <style>
          body { font-family: sans-serif; margin: 40px; }
          h1 { color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <h1>Quote Details: ${quote.title}</h1>
        <p><strong>Quote ID:</strong> ${quote.id}</p>
        <p><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
        <table>
          <tr><th>Item</th><th>Value</th></tr>
          <tr><td>Material</td><td>${quote.materialId}</td></tr>
          <tr><td>Thickness</td><td>${quote.thicknessMm}mm</td></tr>
          <tr><td>Job Type</td><td>${quote.jobType}</td></tr>
        </table>
        <h2>Price Estimate (${estimate.name})</h2>
        <table>
          ${breakdownHtml}
          <tr class="total"><td>Total</td><td style="text-align: right;">${estimate.total.toFixed(2)}</td></tr>
        </table>
        ${thumbnailHtml}
      </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  printWindow?.addEventListener('load', () => {
    printWindow.print();
    // URL.revokeObjectURL(url); // Can cause issues if print dialog is slow
  });
}