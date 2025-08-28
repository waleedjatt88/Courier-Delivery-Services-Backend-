
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
  console.log("Attempting to read logo from this path:", logoPath);
    console.log("Does the logo file exist at this path?", fs.existsSync(logoPath));
 const headerY = 13;  
if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 20, headerY, { width: 100 }); 
}

    
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 200, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${parcel.trackingNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(parcel.createdAt).toLocaleDateString('en-GB')}`, { align: 'right' });
    
    doc.moveDown(4); 

    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 40, doc.y);
    doc.font('Helvetica').text(customer.fullName);
    doc.text(parcel.deliveryAddress);

    doc.font('Helvetica-Bold').text('From:', 300, 140);
    doc.font('Helvetica').text('DevGo Courier Service');
    doc.text('123 Gulberg, Lahore, Pakistan');

    doc.moveDown(2);

    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Description', 40, tableTop);
    doc.text('Weight (kg)', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Amount (Rs.)', 0, tableTop, { align: 'right' });
    doc.moveTo(40, tableTop + 20).lineTo(555, tableTop + 20).stroke(); 
    doc.font('Helvetica');

    
    const itemTop = tableTop + 30;
    doc.text(`Parcel Delivery to ${parcel.deliveryAddress.split(',')[0]}`, 40, itemTop);
    doc.text(parcel.packageWeight.toFixed(2), 300, itemTop, { width: 90, align: 'right' });
    doc.text(parcel.deliveryCharge.toFixed(2), 0, itemTop, { align: 'right' });
    doc.moveTo(40, itemTop + 20).lineTo(555, itemTop + 20).stroke(); 

   
    doc.moveDown(3);
    doc.fontSize(16).font('Helvetica-Bold').text(`Total: Rs. ${parcel.deliveryCharge.toFixed(2)}`, { align: 'right' });
    
    doc.moveDown();
    const status = parcel.paymentStatus.toUpperCase();
    const color = (status === 'COMPLETED' || status === 'PAID') ? '#28a745' : '#dc3545'; 
    doc.fillColor(color).fontSize(18).text(status, { align: 'right' });


    doc.fontSize(10).fillColor('grey').text('Thank you for your business!', 50, 750, { align: 'center', lineBreak: false });



    doc.end();

    return publicUrl;
};

module.exports = {
    generateInvoice
};