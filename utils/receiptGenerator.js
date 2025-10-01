const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateReceipt = async (saleData, format = 'pdf') => {
  const receiptsDir = path.join(__dirname, '..', 'receipts');
  
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const filename = `receipt_${saleData.transaction_id}.${format}`;
  const filepath = path.join(receiptsDir, filename);

  if (format === 'pdf') {
    return await generatePDFReceipt(saleData, filepath);
  } else if (format === 'txt') {
    return await generateTextReceipt(saleData, filepath);
  } else {
    throw new Error('Unsupported format');
  }
};

const generatePDFReceipt = (saleData, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      const header = saleData.settings?.receipt_header || 'Retail Store';
      doc.fontSize(20).text(header, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Receipt', { align: 'center' });
      doc.moveDown(1);

      // Transaction details
      doc.fontSize(10);
      doc.text(`Transaction ID: ${saleData.transaction_id}`);
      doc.text(`Date: ${new Date(saleData.created_at).toLocaleString()}`);
      doc.text(`Cashier: ${saleData.full_name || saleData.username}`);
      
      if (saleData.payment_method) {
        doc.text(`Payment Method: ${saleData.payment_method}`);
      }

      doc.moveDown(1);

      // Line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Items header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 50, doc.y, { width: 250, continued: true });
      doc.text('Qty', 300, doc.y, { width: 50, continued: true });
      doc.text('Price', 350, doc.y, { width: 80, align: 'right', continued: true });
      doc.text('Total', 430, doc.y, { width: 120, align: 'right' });
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica');
      const currencySymbol = saleData.settings?.currency_symbol || '$';

      saleData.items.forEach(item => {
        const y = doc.y;
        doc.text(item.product_name, 50, y, { width: 250 });
        doc.text(item.quantity.toString(), 300, y, { width: 50 });
        doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, 350, y, { width: 80, align: 'right' });
        doc.text(`${currencySymbol}${item.subtotal.toFixed(2)}`, 430, y, { width: 120, align: 'right' });
        doc.moveDown(0.8);
      });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Totals
      doc.font('Helvetica');
      const totalsX = 350;
      const valuesX = 450;

      doc.text('Subtotal:', totalsX, doc.y, { width: 100, continued: true });
      doc.text(`${currencySymbol}${saleData.subtotal.toFixed(2)}`, valuesX, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);

      if (saleData.discount_amount > 0) {
        doc.text('Discount:', totalsX, doc.y, { width: 100, continued: true });
        doc.text(`-${currencySymbol}${saleData.discount_amount.toFixed(2)}`, valuesX, doc.y, { width: 100, align: 'right' });
        doc.moveDown(0.5);
      }

      doc.text(`Tax (${(saleData.tax_rate * 100).toFixed(1)}%):`, totalsX, doc.y, { width: 100, continued: true });
      doc.text(`${currencySymbol}${saleData.tax_amount.toFixed(2)}`, valuesX, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);

      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', totalsX, doc.y, { width: 100, continued: true });
      doc.text(`${currencySymbol}${saleData.total.toFixed(2)}`, valuesX, doc.y, { width: 100, align: 'right' });

      doc.moveDown(2);

      // Footer
      doc.font('Helvetica').fontSize(10);
      const footer = saleData.settings?.receipt_footer || 'Thank you for your business!';
      doc.text(footer, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const generateTextReceipt = (saleData, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      const currencySymbol = saleData.settings?.currency_symbol || '$';
      const header = saleData.settings?.receipt_header || 'Retail Store';
      const footer = saleData.settings?.receipt_footer || 'Thank you for your business!';

      let receipt = '';
      receipt += '='.repeat(50) + '\n';
      receipt += header.toUpperCase().padStart((50 + header.length) / 2) + '\n';
      receipt += 'RECEIPT'.padStart(28) + '\n';
      receipt += '='.repeat(50) + '\n\n';

      receipt += `Transaction ID: ${saleData.transaction_id}\n`;
      receipt += `Date: ${new Date(saleData.created_at).toLocaleString()}\n`;
      receipt += `Cashier: ${saleData.full_name || saleData.username}\n`;
      
      if (saleData.payment_method) {
        receipt += `Payment: ${saleData.payment_method}\n`;
      }

      receipt += '\n' + '-'.repeat(50) + '\n';
      receipt += 'ITEMS\n';
      receipt += '-'.repeat(50) + '\n';

      saleData.items.forEach(item => {
        receipt += `${item.product_name}\n`;
        receipt += `  ${item.quantity} x ${currencySymbol}${item.unit_price.toFixed(2)}`;
        receipt += `${(currencySymbol + item.subtotal.toFixed(2)).padStart(50 - receipt.split('\n').pop().length)}\n`;
      });

      receipt += '\n' + '-'.repeat(50) + '\n';
      receipt += `Subtotal:${(currencySymbol + saleData.subtotal.toFixed(2)).padStart(41)}\n`;

      if (saleData.discount_amount > 0) {
        receipt += `Discount:${('-' + currencySymbol + saleData.discount_amount.toFixed(2)).padStart(41)}\n`;
      }

      receipt += `Tax (${(saleData.tax_rate * 100).toFixed(1)}%):${(currencySymbol + saleData.tax_amount.toFixed(2)).padStart(38)}\n`;
      receipt += '='.repeat(50) + '\n';
      receipt += `TOTAL:${(currencySymbol + saleData.total.toFixed(2)).padStart(44)}\n`;
      receipt += '='.repeat(50) + '\n\n';

      receipt += footer.padStart((50 + footer.length) / 2) + '\n';
      receipt += '='.repeat(50) + '\n';

      fs.writeFileSync(filepath, receipt);
      resolve(filepath);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceipt };
