const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');


const createHeader = (doc) => {
    const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'devgo-logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 20, { width: 100 });
    }
    doc.fontSize(18).font('Helvetica-Bold').text('DevGo Courier Service', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text('123 Builtin-Soft, Punjab, Pakistan', { align: 'right' });
    doc.text('Email: courier.delivery.service2025@gmail.com', { align: 'right' });
    doc.moveDown(2);
};

const createFooter = (doc) => {
    doc.fontSize(10).text(
        'Thank you for your business!',
        doc.page.margins.left,
        doc.page.height - 150, 
        {
            align: 'center',
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        }
    );
};

const createDescriptionTable = (doc, parcel) => {
    const tableTop = doc.y;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Description', 40, tableTop);
    doc.text('Weight (kg)', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Amount (Rs.)', 0, tableTop, { align: 'right' });
    doc.moveTo(40, tableTop + 20).lineTo(555, tableTop + 20).stroke();

    const itemTop = tableTop + 30;
    doc.font('Helvetica').fontSize(11);

    const pickupZoneName = parcel.PickupZone ? parcel.PickupZone.name : 'N/A';
    const deliveryZoneName = parcel.DeliveryZone ? parcel.DeliveryZone.name : 'N/A';

    doc.text(`Pickup Address: ${parcel.pickupAddress}`, 40, itemTop);
    doc.text(`Pickup Zone: ${pickupZoneName}`, 40, itemTop + 15);
    doc.text(`Delivery Address: ${parcel.deliveryAddress}`, 40, itemTop + 30);
    doc.text(`Delivery Zone: ${deliveryZoneName}`, 40, itemTop + 45);
    doc.text(`Delivery Type: ${parcel.deliveryType || 'Standard'}`, 40, itemTop + 60);
    doc.text(`Booking Status: ${parcel.status}`, 40, itemTop + 75);


    doc.text(parcel.packageWeight.toFixed(2), 300, itemTop, { width: 90, align: 'right' });
    doc.text(parcel.deliveryCharge.toFixed(2), 0, itemTop, { align: 'right' });

    doc.moveTo(40, itemTop + 95).lineTo(555, itemTop + 95).stroke();

    return itemTop + 110;
};



const generateBookingInvoice = (parcel, customer) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fileName = `booking-invoice-${parcel.id}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../public/invoices', fileName);
    const publicUrl = `/invoices/${fileName}`;
    doc.pipe(fs.createWriteStream(filePath));

    createHeader(doc);

    doc.fontSize(20).font('Helvetica-Bold').text('BOOKING INVOICE', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${parcel.trackingNumber}`);
    doc.text(`Booking Date: ${new Date(parcel.createdAt).toLocaleDateString('en-GB')}`);
    
    const fromToY = doc.y + 20;
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 40, fromToY);
    doc.font('Helvetica').text(customer.fullName, 40, fromToY + 15);
    doc.fontSize(12).font('Helvetica-Bold').text('From:', 300, fromToY);
    doc.font('Helvetica').text('DevGo Courier Service', 300, fromToY + 15);
    doc.y = fromToY + 80;

    const totalY = createDescriptionTable(doc, parcel); 

    doc.fontSize(14).font('Helvetica-Bold').text(`Total: Rs. ${parcel.deliveryCharge.toFixed(2)}`, 40, totalY, { align: 'right' });
    doc.fontSize(11).font('Helvetica').text(`Payment Method: ${parcel.paymentMethod || 'N/A'}`, 40, totalY + 20, { align: 'right' });
    doc.text(`Payment Status: ${parcel.paymentStatus}`, 40, totalY + 35, { align: 'right' });

    createFooter(doc);
    doc.end();
    return publicUrl;
};


const generateDeliveryInvoice = (parcel, customer) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fileName = `delivery-invoice-${parcel.id}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../public/invoices', fileName);
    const publicUrl = `/invoices/${fileName}`;
    doc.pipe(fs.createWriteStream(filePath));

    createHeader(doc);

    doc.fontSize(20).font('Helvetica-Bold').text('PROOF OF DELIVERY', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text(`Tracking #: ${parcel.trackingNumber}`);
    doc.text(`Delivery Date: ${new Date().toLocaleDateString('en-GB')}`);
    
    const fromToY = doc.y + 20;
    doc.fontSize(12).font('Helvetica-Bold').text('Delivered To:', 40, fromToY);
    doc.font('Helvetica').text(customer.fullName, 40, fromToY + 15);
    doc.fontSize(12).font('Helvetica-Bold').text('From:', 300, fromToY);
    doc.font('Helvetica').text('DevGo Courier Service', 300, fromToY + 15);
    doc.y = fromToY + 80;

    const totalY = createDescriptionTable(doc, parcel); 
    
      if (parcel.paymentStatus === 'completed') {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('green').text('PAID', 40, totalY + 20, { align: 'right' });
        doc.fillColor('black').font('Helvetica').text(`Paid via: ${parcel.paymentMethod}`, 40, totalY + 35, { align: 'right' });
    
    } else if (parcel.paymentMethod === 'COD') {
        doc.fontSize(11).font('Helvetica-Bold').text(`Payment Method: COD (Cash on Delivery)`, 40, totalY + 20, { align: 'right' });
    
    } else {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('red').text('PAYMENT PENDING', 40, totalY + 20, { align: 'right' });
    }

    createFooter(doc);
    doc.end();
    return publicUrl;
};


module.exports = {
    generateBookingInvoice,
    generateDeliveryInvoice,
};