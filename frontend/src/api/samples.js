// The same mock extraction as api/quotelens/extraction.py: the API does not read the PDF yet,
// it returns one of these three sample quotes by upload position. Demo mode does the same.

const included = (amount = null, detail = '') => ({ status: 'included', amount, detail });
const extra = (amount, detail = '') => ({ status: 'extra', amount, detail });

export const SAMPLES = [
  {
    contractor: { name: 'ABC Countertops', contactName: 'John Doe', email: 'john@abccountertops.com', phone: '301-555-0123', city: 'Gaithersburg, MD' },
    quoteNumber: 'EST-2291', quoteDate: '2026-10-14', materialType: 'Granite', color: 'Steel Gray',
    totalPrice: 8750, squareFootage: 42, edgeProfile: 'Eased',
    services: { fabrication: included(1700), installation: included(1200), sinkCutout: included(), backsplash: included(600, '4 in.') },
    notes: 'Price valid 30 days. Plumbing disconnect and reconnect by others.',
    lineItems: [
      { description: 'Steel Gray granite, 3 cm (42 sq ft)', price: 5250 },
      { description: 'Fabrication', price: 1700 },
      { description: 'Installation', price: 1200 },
      { description: '4 in. backsplash', price: 600 },
    ],
  },
  {
    contractor: { name: 'Premier Stone', contactName: 'Maria Lopez', email: 'maria.lopez@premierstone.com', phone: '240-555-0188', city: 'Rockville, MD' },
    quoteNumber: '1047', quoteDate: '2026-10-17', materialType: 'Quartz', color: 'Calacatta White',
    totalPrice: 9980, squareFootage: 42, edgeProfile: 'Eased',
    services: { fabrication: included(1890), installation: included(1370), sinkCutout: extra(250) },
    otherItems: 'Template visit: Included',
    notes: 'Sink cutout billed separately. Final price set after template measurement.',
    lineItems: [
      { description: 'Calacatta White quartz, 3 cm (42 sq ft)', price: 6720 },
      { description: 'Fabrication', price: 1890 },
      { description: 'Installation', price: 1370 },
    ],
  },
  {
    contractor: { name: 'Modern Surfaces', contactName: 'Sam Patel', phone: '301-555-0147' },
    quoteNumber: 'MS-0820', quoteDate: '2026-10-20', materialType: 'Granite', color: 'Black Pearl',
    totalPrice: 8200, squareFootage: 40, edgeProfile: 'Half bullnose',
    services: { fabrication: included(1800), installation: extra(600), sinkCutout: included(), backsplash: included(800, '4 in.'), tearOut: included() },
    notes: 'Installation quoted separately. 40 sq ft based on homeowner sketch, to be confirmed at template.',
  },
];

const SERVICE_KEYS = ['fabrication', 'installation', 'sinkCutout', 'backsplash', 'tearOut'];
const emptyService = () => ({ status: 'not_specified', amount: null, detail: '' });

// Fill in every default the API's ExtractedQuote model has, so demo records match API records.
export function normalizeExtracted(data) {
  const services = {};
  for (const key of SERVICE_KEYS) services[key] = { ...emptyService(), ...(data.services?.[key] || {}) };
  return {
    contractor: { name: '', contactName: '', email: '', phone: '', city: '', ...(data.contractor || {}) },
    quoteNumber: data.quoteNumber ?? '',
    quoteDate: data.quoteDate ?? '',
    materialType: data.materialType ?? '',
    color: data.color ?? '',
    totalPrice: data.totalPrice ?? null,
    squareFootage: data.squareFootage ?? null,
    edgeProfile: data.edgeProfile ?? '',
    services,
    otherItems: data.otherItems ?? '',
    notes: data.notes ?? '',
    lineItems: (data.lineItems || []).map((item) => ({ description: item.description, price: item.price ?? null })),
  };
}

export function extractQuote(position) {
  return normalizeExtracted(structuredClone(SAMPLES[position % SAMPLES.length]));
}
