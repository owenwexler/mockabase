import type { NewUser } from "../typedefs/NewUser";

// seed data for the Mockabase tests and all my open-source apps that use Mockabase for testing
const seedData: NewUser[] = [
  {
    id: '7402e76c-e5bd-4862-ab6b-b742f664b17e',
    email: 'owenwexler@mockabase.com',
    password: 'owexler!1', // the most secure password ever
    phoneNumber: null,
    providerType: 'email-password',
    oauthProvider: null,
    otp: null
  },
  {
    id: 'b45699e0-bfba-4525-a0d5-298ead5b6c35',
    email: 'someoneelse@someoneelse.com',
    password: 'someoneelse!1',
    phoneNumber: null,
    providerType: 'email-password',
    oauthProvider: null,
    otp: null
  },
  {
    id: '51ec2a1b-8732-41c8-8893-e2f096f5df9a',
    email: 'blank@blank.com',
    password: 'blank!1',
    phoneNumber: null,
    providerType: 'email-password',
    oauthProvider: null,
    otp: null
  },
  {
    id: '058e724c-0a31-4d4f-b391-fd7e2c11ef11',
    email: null,
    password: null,
    phoneNumber: '+13011234567',
    providerType: 'phone',
    oauthProvider: null,
    otp: null
  },
  {
    id: 'adfeea11-1bef-4bbd-b97b-35a2eb268592',
    email: 'example@gmail.com',
    password: null,
    phoneNumber: null,
    providerType: 'oauth',
    oauthProvider: null,
    otp: null
  },
  {
    id: 'e2b0d325-ed46-435c-a4cf-adc885614f40',
    email: 'passwordlessemail@mockabase.com',
    password: null,
    phoneNumber: null,
    providerType: 'email-passwordless',
    oauthProvider: null,
    otp: null
  }
];

export {
  seedData
}
