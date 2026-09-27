import { PresetLoan, CurrencyConfig } from '../types';

export const PRESET_LOANS: PresetLoan[] = [
  {
    id: 'personal_5y',
    name: 'Personal Loan',
    type: 'Personal',
    principal: 500000,
    annualInterestRate: 10.5,
    years: 5,
    months: 0,
    description: 'Standard 5-year personal loan (₹5 Lakhs @ 10.5%)'
  },
  {
    id: 'home_20y',
    name: 'Home Loan (20Y)',
    type: 'Real Estate',
    principal: 4000000,
    annualInterestRate: 8.5,
    years: 20,
    months: 0,
    description: 'Traditional 20-year fixed home loan (₹40 Lakhs @ 8.5%)'
  },
  {
    id: 'home_15y',
    name: 'Home Loan (15Y)',
    type: 'Real Estate',
    principal: 2500000,
    annualInterestRate: 8.25,
    years: 15,
    months: 0,
    description: 'Accelerated 15-year home loan (₹25 Lakhs @ 8.25%)'
  },
  {
    id: 'auto_5y',
    name: 'Auto / Car Loan',
    type: 'Vehicle',
    principal: 800000,
    annualInterestRate: 8.9,
    years: 5,
    months: 0,
    description: 'New vehicle financing (₹8 Lakhs @ 8.9%)'
  },
  {
    id: 'gold_2y',
    name: 'Short-Term Loan',
    type: 'Personal',
    principal: 200000,
    annualInterestRate: 7.75,
    years: 2,
    months: 0,
    description: 'Short-term credit or gold loan (₹2 Lakhs @ 7.75%)'
  }
];

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' }
];

