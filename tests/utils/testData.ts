/**
 * Generates a unique first name per test run using a timestamp suffix.
 * This ensures each test creates distinct data that can be filtered/verified.
 */
export function uniqueFirstName(): string {
  return `Auto${Date.now().toString(36)}`;
}

export const validLead = {
  title: 'Mr',
  firstName: uniqueFirstName(),
  lastName: 'LeadCreate',
  mobile: '0821234567',
  email: 'autotest.leadcreate@example.com',
  clientType: 'Individual (Individual)',
  province: 'Gauteng',
  preferredCommunication: 'Email',
  leadChannel: 'Cold Call',
  description: 'Automated test lead creation',
};

// NOTE: Known issue — the global search bar on the Leads table does not filter results.

// Existing converted lead used for read-only tests (avoids creating new data)
export const convertedLead = {
  firstName: 'Link',
  lastName: 'Test',
  accountName: 'Link Test',
};

export const invalidEmails = ['notanemail', 'missing@', '@nodomain', 'spaces in@email.com'];
export const invalidMobiles = ['ABCDEFGHIJ', 'letters', '12345'];
export const longFirstName = 'A'.repeat(100);

export const requiredFields = [
  { field: 'firstName', label: 'First Name', expectedError: 'First name is required' },
  { field: 'lastName', label: 'Last Name', expectedError: 'Last name is required' },
  { field: 'mobile', label: 'Mobile', expectedError: 'Mobile number is required' },
  { field: 'email', label: 'Email', expectedError: 'Email address is required' },
  { field: 'clientType', label: 'Client Type', expectedError: 'Client type is required' },
  { field: 'province', label: 'Province', expectedError: 'Province is required' },
  { field: 'leadChannel', label: 'Lead Channel', expectedError: 'Lead channel is required' },
] as const;

export type RequiredFieldKey = typeof requiredFields[number]['field'];

// --- Pre-Screening Questionnaire ---
// Questions where "Yes" answer = pass pre-screening
export const preScreeningPassYes = [
  'Is the applicant a South African citizen?',
  'Is the farming land located in South Africa?',
  'Do the intended farming activities fall within the Land Bank mandate?',
  "Is the client's current Country of Residence South Africa?",
  'Does the client currently have access to suitable land for farming activities?',
];
// Questions where "No" answer = pass pre-screening
export const preScreeningPassNo = [
  'Is the client blacklisted?',
  'Is the client currently under debt review?',
];

// --- Loan / Opportunity test data ---

export const clientInfoDetails = {
  idNumber: '7708206169188',
  firstName: 'Ian',
  lastName: 'Houvet',
  email: 'promise.raganya@boxfusion.io',
  countryOfResidence: 'South Africa',
  citizenship: 'South Africa',
  countryOfOrigin: 'South Africa',
  clientClassification: 'Development',
  maritalStatus: 'Single',
};

export const loanInfo = {
  summary: 'Automated test loan summary',
  amount: '50000',
  product: 'R MT Loans',
  existingRelationship: 'None',
  sourcesOfIncome: 'Farming income',
  loanPurpose: 'Purchase Of Livestock',
  loanPurposeAmount: '50000',
};

export const farmData = {
  name: 'Boxfusion',
  landTenureStatus: 'Owned',
  typesOfFarming: ['Aqua Culture', 'Cash Crops - General'],
  size: '2300',
  province: 'Limpopo',
  region: 'Central Region',
};

export const assignedTo = 'Fatima Abrahams';
export const opportunityOwner = 'Fatima Abrahams';
