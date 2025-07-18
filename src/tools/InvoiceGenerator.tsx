import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaFileInvoiceDollar, FaDownload, FaPlus, FaTrash, FaPrint } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { jsPDF } from 'jspdf';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  notes: string;
}

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    items: [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
    taxRate: 0,
    discountRate: 0,
    notes: ''
  });

  const updateInvoice = (field: keyof InvoiceData, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (invoice.discountRate / 100);
  };

  const calculateTax = () => {
    return (calculateSubtotal() - calculateDiscount()) * (invoice.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('INVOICE', 20, y);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, y + 15);
    doc.text(`Date: ${invoice.date}`, 20, y + 25);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, y + 35);

    y += 60;

    // Company Info
    doc.setFontSize(14);
    doc.text('From:', 20, y);
    doc.setFontSize(12);
    if (invoice.companyName) doc.text(invoice.companyName, 20, y + 10);
    if (invoice.companyAddress) doc.text(invoice.companyAddress, 20, y + 20);
    if (invoice.companyEmail) doc.text(invoice.companyEmail, 20, y + 30);
    if (invoice.companyPhone) doc.text(invoice.companyPhone, 20, y + 40);

    // Client Info
    doc.setFontSize(14);
    doc.text('To:', 120, y);
    doc.setFontSize(12);
    if (invoice.clientName) doc.text(invoice.clientName, 120, y + 10);
    if (invoice.clientAddress) doc.text(invoice.clientAddress, 120, y + 20);
    if (invoice.clientEmail) doc.text(invoice.clientEmail, 120, y + 30);

    y += 70;

    // Items Table Header
    doc.setFillColor(59, 130, 246);
    doc.rect(20, y, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Description', 25, y + 7);
    doc.text('Qty', 120, y + 7);
    doc.text('Rate', 140, y + 7);
    doc.text('Amount', 165, y + 7);

    y += 15;
    doc.setTextColor(0, 0, 0);

    // Items
    invoice.items.forEach(item => {
      if (item.description) {
        doc.text(item.description.substring(0, 40), 25, y);
        doc.text(item.quantity.toString(), 120, y);
        doc.text(`$${item.rate.toFixed(2)}`, 140, y);
        doc.text(`$${item.amount.toFixed(2)}`, 165, y);
        y += 10;
      }
    });

    y += 10;

    // Totals
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    const total = calculateTotal();

    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 120, y);
    y += 10;
    if (discount > 0) {
      doc.text(`Discount (${invoice.discountRate}%): -$${discount.toFixed(2)}`, 120, y);
      y += 10;
    }
    if (tax > 0) {
      doc.text(`Tax (${invoice.taxRate}%): $${tax.toFixed(2)}`, 120, y);
      y += 10;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text(`Total: $${total.toFixed(2)}`, 120, y);

    // Notes
    if (invoice.notes) {
      y += 20;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Notes:', 20, y);
      const notes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(notes, 20, y + 10);
    }

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <ToolWrapper
      toolId="invoice-generator"
      toolName="Professional Invoice Generator"
      toolDescription="Create professional invoices instantly. Generate PDF invoices with itemized billing, tax calculations, and custom branding"
      toolCategory="Business"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <IconWrapper icon={FaFileInvoiceDollar} className="text-3xl text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Invoice Generator
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <IconWrapper icon={FaDownload} />
                Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconWrapper icon={FaPrint} />
                Print
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={invoice.date}
                    onChange={(e) => updateInvoice('date', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Your Information</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={invoice.companyName}
                    onChange={(e) => updateInvoice('companyName', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Company Address"
                    value={invoice.companyAddress}
                    onChange={(e) => updateInvoice('companyAddress', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={invoice.companyEmail}
                      onChange={(e) => updateInvoice('companyEmail', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={invoice.companyPhone}
                      onChange={(e) => updateInvoice('companyPhone', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Bill To</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={invoice.clientName}
                    onChange={(e) => updateInvoice('clientName', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Client Address"
                    value={invoice.clientAddress}
                    onChange={(e) => updateInvoice('clientAddress', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                    rows={2}
                  />
                  <input
                    type="email"
                    placeholder="Client Email"
                    value={invoice.clientEmail}
                    onChange={(e) => updateInvoice('clientEmail', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Items</h3>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <IconWrapper icon={FaPlus} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="col-span-6 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="col-span-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                        className="col-span-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <div className="col-span-1 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        ${item.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="col-span-1 p-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <IconWrapper icon={FaTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={invoice.taxRate}
                    onChange={(e) => updateInvoice('taxRate', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    value={invoice.discountRate}
                    onChange={(e) => updateInvoice('discountRate', Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes or terms..."
                  value={invoice.notes}
                  onChange={(e) => updateInvoice('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Preview</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 min-h-96">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-600">INVOICE</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">#{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Date: {invoice.date}</p>
                    <p>Due: {invoice.dueDate}</p>
                  </div>
                </div>

                {/* From/To */}
                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">From:</h4>
                    <div className="text-gray-600 dark:text-gray-400">
                      <p className="font-medium">{invoice.companyName || 'Your Company'}</p>
                      <p>{invoice.companyAddress}</p>
                      <p>{invoice.companyEmail}</p>
                      <p>{invoice.companyPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">To:</h4>
                    <div className="text-gray-600 dark:text-gray-400">
                      <p className="font-medium">{invoice.clientName || 'Client Name'}</p>
                      <p>{invoice.clientAddress}</p>
                      <p>{invoice.clientEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="text-left p-2">Description</th>
                        <th className="text-center p-2">Qty</th>
                        <th className="text-right p-2">Rate</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b dark:border-gray-600">
                          <td className="p-2">{item.description || 'Item description'}</td>
                          <td className="text-center p-2">{item.quantity}</td>
                          <td className="text-right p-2">${item.rate.toFixed(2)}</td>
                          <td className="text-right p-2">${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-48 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {invoice.discountRate > 0 && (
                      <div className="flex justify-between">
                        <span>Discount ({invoice.discountRate}%):</span>
                        <span>-${calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({invoice.taxRate}%):</span>
                        <span>${calculateTax().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-blue-600 text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-6 text-sm">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Notes:</h4>
                    <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">💼 Pro Tips:</h3>
            <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
              <li>• Include clear payment terms and due dates</li>
              <li>• Add your logo and branding for professional appearance</li>
              <li>• Keep detailed records of all invoices for tax purposes</li>
              <li>• Follow up on overdue invoices promptly</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
