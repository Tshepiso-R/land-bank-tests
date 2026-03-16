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
  { field: 'title', label: 'Title' },
  { field: 'firstName', label: 'First Name' },
  { field: 'lastName', label: 'Last Name' },
  { field: 'mobile', label: 'Mobile Number' },
  { field: 'email', label: 'Email Address' },
  { field: 'clientType', label: 'Client Type' },
  { field: 'province', label: 'Province' },
  { field: 'preferredCommunication', label: 'Preferred Communication' },
  { field: 'leadChannel', label: 'Lead Channel' },
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

// --- Testmail.app config ---
export const testmailNamespace = '5s9ku';
export const testmailApiKey = 'b300bfdf-3e55-4478-9e27-072849073ed4';

export function testmailAddress(tag: string): string {
  return `${testmailNamespace}.${tag}@inbox.testmail.app`;
}

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

// --- Entity Lead test data ---

export const entityLead = {
  title: 'Mr',
  firstName: uniqueFirstName(),
  lastName: 'Houvet',
  mobile: '0712345678',
  email: 'tinaye.mushore@boxfusion.io',
  clientType: 'Close Corporation (Entity)',
  entityName: 'Boxfusion',
  province: 'Gauteng',
  preferredCommunication: 'Email',
  leadChannel: 'Cold Call',
  description: 'Automated entity smoke test',
};

export const entityInfo = {
  entityName: 'Boxfusion',
  companyRegistrationNumber: '2012/225386/07',
  yearsInOperation: 15,
  entityOrgType: 'Pty Ltd',
  clientClassification: 'Commercial',
  beeLevel: 'Level 6',
  countryOfResidence: 'South Africa',
  citizenship: 'South Africa',
};

export const directors = [
  {
    firstName: 'Ian',
    lastName: 'Houvet',
    idNumber: '7708206169188',
    email: 'tinaye.mushore@boxfusion.io',
    mobile: '0712345678',
    citizenship: 'South Africa',
    countryOfResidence: 'South Africa',
    countryOfOrigin: 'South Africa',
    maritalStatus: 'Married',
  },
  {
    firstName: 'Xolile',
    lastName: 'Ndlangana',
    idNumber: '6311115651080',
    email: 'Grace.Nyamushonyongora@boxfusion.io',
    mobile: '0712345678',
    citizenship: 'South Africa',
    countryOfResidence: 'South Africa',
    countryOfOrigin: 'South Africa',
    maritalStatus: 'Married',
  },
  {
    firstName: 'Chamaine',
    lastName: 'Houvet',
    idNumber: '7304190225085',
    email: 'tinaye.mushore@gmail.com',
    mobile: '0712345678',
    citizenship: 'South Africa',
    countryOfResidence: 'South Africa',
    countryOfOrigin: 'South Africa',
    maritalStatus: 'Married',
  },
];

export const signatoryData = {
  firstName: 'Ian',
  lastName: 'Houvet',
  idNumber: '7708206169188',
  email: 'tinaye.mushore@boxfusion.io',
  mobile: '0710736377',
};

export const entityLoanInfo = {
  summary: 'User manual test',
  amount: '50000',
  product: 'R MT Loans',
  existingRelationship: 'Existing Client',
  sourcesOfIncome: 'Farming income',
  loanPurpose: 'Purchase Of Movable Assets',
  loanPurposeAmount: '40000',
};

export const entityFarmData = {
  name: 'Land Farm',
  landTenureStatus: 'Owned',
  typesOfFarming: ['Agro-Chemicals', 'Agri-Business'],
  size: '10',
  province: 'Gauteng',
  region: 'Central Region',
};

// --- Onboarding Checklist test data ---

export const onboardingChecklist = {
  yearsOfFarmingExperience: '4 to 6 Years',
  waterUseRights: true,
  businessPlanSupport: false,
  equipmentAccess: true,
  taxClearance: true,
  marketAccess: true,
  financialRecords: true,
  mentorEngaged: false,
  laborLawCompliant: true,
};
