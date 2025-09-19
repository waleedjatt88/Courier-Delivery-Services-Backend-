const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const generateInvoice = (parcel, customer) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const fileName = `invoice-${parcel.id}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../public/invoices', fileName);
    const publicUrl = `/invoices/${fileName}`;

    doc.pipe(fs.createWriteStream(filePath));

    const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'devgo-logo.png');
    const headerY = 20;
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, headerY, { width: 100 });
    }

    doc.fontSize(18).font('Helvetica-Bold').text('DevGo Courier Service', 200, headerY, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text('123 Builtin-Soft, Punjab, Pakistan', { align: 'right' });
    doc.text('Email: courier.delivery.service2025@gmail.com', { align: 'right' });

    doc.moveDown(2);

    doc.fontSize(26).font('Helvetica-Bold').text('INVOICE', 40, 150);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${parcel.trackingNumber}`, 40, 180);
    doc.text(`Date: ${new Date(parcel.createdAt).toLocaleDateString('en-GB')}`, 40, 195);

    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 40, doc.y);
    doc.font('Helvetica').text(customer.fullName);
    doc.text(parcel.deliveryAddress);

    doc.fontSize(12).font('Helvetica-Bold').text('From:', 300, 240);
    doc.font('Helvetica').text('DevGo Courier Service');
    doc.text('123 Gulberg, Lahore, Pakistan');

    doc.moveDown(2);

    const tableTop = doc.y + 10;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Description', 40, tableTop);
    doc.text('Weight (kg)', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Amount (Rs.)', 0, tableTop, { align: 'right' });
    doc.moveTo(40, tableTop + 20).lineTo(555, tableTop + 20).stroke();

    const itemTop = tableTop + 30;
    doc.font('Helvetica').fontSize(11);

    doc.text(`Parcel Delivery to: ${parcel.deliveryAddress.split(',')[0]}`, 40, itemTop);
    doc.text(`Delivery Type: ${parcel.deliveryType || 'Standard'}`, 40, itemTop + 15);
    doc.text(`Booking Status: ${parcel.status}`, 40, itemTop + 30);

    doc.text(parcel.packageWeight.toFixed(2), 300, itemTop, { width: 90, align: 'right' });
    doc.text(parcel.deliveryCharge.toFixed(2), 0, itemTop, { align: 'right' });

    doc.moveTo(40, itemTop + 50).lineTo(555, itemTop + 50).stroke();

    doc.moveDown(3);
    doc.fontSize(14).font('Helvetica-Bold').text(`Total: Rs. ${parcel.deliveryCharge.toFixed(2)}`, { align: 'right' });

doc.moveDown();
doc.fontSize(12).fillColor('black').text(
    `paymentMethod = ${parcel.paymentMethod || 'N/A'}`,
    { align: 'right' }
);
doc.text(
    `paymentStatus = ${parcel.paymentStatus}`,
    { align: 'right' }
);


    doc.moveDown(2);
    doc.fillColor('black').fontSize(10).text('Thank you for your business!', 50, 750, { align: 'center', lineBreak: false });

    doc.end();

    return publicUrl;
};

module.exports = {
    generateInvoice
};
