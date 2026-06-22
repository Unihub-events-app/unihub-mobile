// Supported countries for multi-country system
export const supportedCountries = [
  'Nigeria',
  'South Africa',
  'Ghana',
  'Namibia',
  'Kenya'
];

export const countryOptions = supportedCountries.map(country => ({
  value: country,
  label: country
}));
