// Utility functions for formatting property data

export function formatPrice(price: string, transactionType: string = 'sale', rentFrequency?: string): string {
  // Remove any existing currency symbols and spaces
  const cleanPrice = price.replace(/[₹,\s]/g, '');
  const numericPrice = parseFloat(cleanPrice);
  
  if (isNaN(numericPrice)) return price;

  if (transactionType === 'rent') {
    const frequency = rentFrequency === 'yearly' ? '/year' : '/month';
    return `₹${numericPrice.toLocaleString('en-IN')}${frequency}`;
  }

  // Format for sale prices
  if (numericPrice >= 10000000) { // 1 Cr and above
    const crores = numericPrice / 10000000;
    return `₹${crores.toFixed(crores >= 10 ? 0 : 1)} Cr`;
  } else if (numericPrice >= 100000) { // 1 Lakh and above
    const lakhs = numericPrice / 100000;
    return `₹${lakhs.toFixed(lakhs >= 10 ? 0 : 1)} L`;
  } else if (numericPrice >= 1000) { // 1 Thousand and above
    const thousands = numericPrice / 1000;
    return `₹${thousands.toFixed(thousands >= 10 ? 0 : 1)} K`;
  } else {
    return `₹${numericPrice.toLocaleString('en-IN')}`;
  }
}

export function formatArea(size: string, unit: string): string {
  const numericSize = parseFloat(size);
  if (isNaN(numericSize)) return `${size} ${unit}`;
  
  return `${numericSize.toLocaleString('en-IN')} ${unit}`;
}

export function getListingTypeBadgeColor(listingType: string): string {
  switch (listingType) {
    case 'exclusive':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'colisting':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shared':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getListingTypeLabel(listingType: string): string {
  switch (listingType) {
    case 'exclusive':
      return 'Exclusive';
    case 'colisting':
      return 'Co-Listing';
    case 'shared':
      return 'Shared';
    default:
      return listingType;
  }
}

export function convertAreaUnit(value: number, fromUnit: string, toUnit: string): number {
  const sqFtConversions = {
    'sq.ft': 1,
    'sq.m': 10.764,
    'sq.yd': 9,
    'acre': 43560
  };

  const valueInSqFt = value * (sqFtConversions[fromUnit as keyof typeof sqFtConversions] || 1);
  return valueInSqFt / (sqFtConversions[toUnit as keyof typeof sqFtConversions] || 1);
}