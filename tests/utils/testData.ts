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
