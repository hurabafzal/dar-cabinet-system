export const invoiceFields = [
  { name: "customerId", label: "Customer", type: "select" },
  { name: "invoiceDate", label: "Invoice Date", type: "date" },
];

export const invoiceItemFields = [
  { name: "itemId", label: "Item", type: "select" },
  { name: "description", label: "Description", type: "input" },
  { name: "quantity", label: "Qty", type: "input" },
  { name: "price", label: "Price", type: "input" },
];

export const invoiceSummaryFields = [
  { name: "grossAmount", label: "Subtotal", type: "input", disabled: true },
  { name: "discount", label: "Discount", type: "input" },
  { name: "totalAmount", label: "Total", type: "input", disabled: true },
];

export const invoiceAdditionalInfoFields = [
  { name: "measurementId", label: "Measurement", type: "select" },
  { name: "measurementDescription", label: "Description", type: "input", disabled: true },
];