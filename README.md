# Mockabase

Mockabase is a minimal open-source local offline mock authentication service that approximately mocks the Supabase API for use in automated testing and development.  I made Mockabase because I personally found Supabase hard to test with in development and found that I needed a mock service that would allow me to consistently create and delete test users without having several different real email addresses.  I personally believe it is ok to mock Supabase when doing automated tests of an app's functionality, as automated testing of live Supabase responses would be tantamount to testing Supabase itself, which the Supabase team has covered.  That said, of course, I recommend doing some manual acceptance testing of your app with live Supabase responses too.

## Disclaimers

**IMPORTANT: UNDER NO CIRCUMSTANCES SHOULD MOCKABASE BE USED IN PRODUCTION.  MOCKABASE IS NOT A PRODUCTION-READY AUTH SERVICE.  MOCKABASE IS STRICTLY FOR USE IN TESTING, PROTOTYPING, AND LOCAL DEVELOPMENT.  ANY USE OF MOCKABASE IN PRODUCTION IS NOT CONDONED BY THE CREATORS AND MAINTAINERS, IS AT YOUR OWN RISK, AND THE CREATORS AND MAINTAINERS OF MOCKABASE ARE NOT TO BE HELD LIABLE UNDER ANY CIRCUMSTANCES FOR LOSSES RELATED TO THE ILL-ADVISED USE OF THIS SERVICE IN PRODUCTION APPS.**

I am not affiliated with Supabase or the Supbase team in any way.  This service is not condoned, supported, or endorsed by Supabase or the Supabase team in any way.

I simply wrote this to solve a problem I had with testing Supabase auth in my apps consistently and decided to open-source it in the hope that it would help other developers solve similar problems.  That's all.

This is not a commercial project and I'm not making money from it.  The name Supabase belongs to its creators.

# How does Mockabase work?
Mockabase uses an embedded SQLite database (in a file called mockabase.sqlite) with a users table that loosely mocks the ```auth.users``` table in Supabase.  There are various routes for all expected user functions detailed in the routes section below.  "Sessions" are currently handled with a JSON file at the root of the project called ```session.json```, which is either null if logged out or has the id and e-mail of the current user if logged in.  I consider this an acceptable minimal way to mock sessions for testing and development purposes.

## Why SQLite and not PostgreSQL?
Although Supabase uses Postgres under the hood, as of September 2025, Mockabase uses an embedded SQLite database for simplicity and portability.  When Mockabase was using PostgreSQL, the user was required to have PostgreSQL installed and set up locally, and then set up a local database as part of the setup process for Mockabase.  With SQLite, the database is simply a file that is created as soon as the user starts Mockabase, with most of the same functionality and no need for a local install.  Any relevant Postgres-exclusive functions such as timestamps and UUIDs are handled within Mockabase's code rather than in the database.  We recommend using [TablePlus](https://tableplus.com/) to look at the SQLite database directly should the need arise.

# Major breaking changes
## version 4.0 (March 2026)
Add phone signup and login, add mock OTP functions, organize all routes by type.  Major breaking changes to Mockabase schemas, routes, and APIs all around to make these changes happen.  Changes to the Mockabase client, which we encourage using, are fairly minimal aside from the addition of new functions.

Mockabase now also uses the [dataerror](https://www.npmjs.com/package/dataerror) error-handling library as a core dependency and most return statements have been rewritten to use dataerror.

Additionally, Mockabase now uses [Drizzle ORM](https://orm.drizzle.team) for end-to-end type safety in all database models, schemas, and functions.

## version 3.0 (October 2025)
All functions in the Mockabase client are now under a singular "auth" object, in order to mirror the Supabase API even more accurately.

## version 2.5 (September 2025)
Move database from local Postgres to an embedded SQLite database

## version 2.0
```signup```, ```login```, and ```get-current-session``` routes now return objects in the following format:
```{ data: { user: User } | null, error: error | null } ```

This more closely mirrors the Supabase API.

Errors are now returned as Supabase-like error objects instead of strings, to more closely mirror the Supabase API.  For a complete reference of all error objects returned by Mockabase, see the dataerror documentation an the ```src/data/mockabaseErrors.ts``` file.

# Installation

You must have the following installed locally to use Mockabase:
* Node

1.  Make sure you have [Node](https://nodejs.org/) installed locally.

2.  Fork and/or clone the repository.

3.  Run ```npm install``` to install all dependencies.

4.  Create a ```.env``` file and set up all environment variables according to the ```.env.example``` file.  For the PORT number, I recommend using a port number you don't use for any other servers or services, since you'll likely be running Mockabase alongside of many other services.

5.  Create a ```testEnv.ts``` file in the ```tests/testEnv``` folder and set up all the ```testEnv``` variables according to the ```testEnv.example.ts``` file.  This is necessary because Vitest can not read ```process.env```.

6.  Create a user using the ```/signup``` route (very important to use the ```/signup``` route so you get a properly hashed password) for use with the mock OAuth function and fill out the corresponding environment variables in both ```.env``` and ```testEnv.ts``` accordingly.

7.  Run the server using ```npm run dev```.

8.  Run the tests using ```npm run test``` and confirm that they all pass.

9.  Running the tests leaves three users used to test a few of my other open source apps in the database which is why they are left in.  They are cleared and re-seeded at the beginning of every test run and left in at the end.

# Tests
Mockabase has a comprehensive test suite written with Vitest and covering most of Mockabase' core functions.  Not all code is unit-tested, but almost all core functions except the ```/admin/clear``` endpoint are covered by the tests.  Any new major features contributed must be accompanied by tests confirming they work and must not break any existing tests unless the feature in question is a major breaking feature.  In this case, the way the tests were broken and had to be refactored must be documented.

## Suggsted Usage
In your frontend, use an environment variable like ```NODE_ENV``` that is set to ```testing``` when it's time to test the app or prototype, then design your code to conditionally use Mockabase for authentication and authorization in all of your auth checks, login/logout functions, etc. only while the environment variable of your choice is set to ```testing``` or whatever you designate to be "testing mode".

Example:
```
const mockabase = createMockabaseClient({ mockabaseUrl: env.MOCKABASE_URL });
const supabase = createSupabaseClient();

const email = 'example@email.com';
const password: 'example-password';

if (process.env.NODE_ENV === 'testing') {
  const result = await mockabase.auth.signInWithPassword{
    email,
    password
  }
  const { data, error } = result;
} else {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
}
```

# Directory structure
```
mockabase
├── src - source files
│   ├── data - data files used by the app like blank objects, the seed and test user data for the DB
│   ├── db - the file to initialize the DB and Drizzle (db.ts) and the Drizzle schema (schema.ts)
│   │   ├── models - all DB models (email-password, email-passwordless, phone, OAuth, OTP, and delete)
│   ├── helper - helper functions for comparing passwords, hashing, fetching, etc.
│   ├── mockabaseClient - the Mockabase client
│   ├── routes - all route files organized by auth type
│   ├── session - all functions for creating, deleting, and managing sessions
│   ├── sql - the schema file used to build the local database
│   ├── typedefs - type definitions
│   ├── index.ts - the main file containing the server initialization, the beating heart of Mockabase
├── tests - test directory
│   ├── testEnv - test environment (not committed to GitHub, must be created manually), and the template for creating the test environment manually)
│   ├── testFunctions - all reusable functions used in the tests
│   ├── core-functions.test.ts - test file for all Mockabase core functions
├── .env - environment variables (not committed to GitHub, must be created manually)
├── .env.example - environment variable template or creating .env
├── .gitignore - .gitignore file
├── CODE_OF_CONDUCT.md - contributor code of conduct
├── CONTRIBUTING.md - contributing guidelines
├── mockabase.sqlite - the embedded SQLite database file
├── mockabase.sqlite-shm - shared memory file for mockabase.sqlite
├── mockabase.sqlite-wal - write-ahead-log file for mockabase.sqlite
├── package.json - NPM package.json file
├── package-lock.json - NPM package-lock.json file
├── README.md - this file
├── session.json - JSON file that stores all mock "session" data - null if logged out, session data of logged-in user if logged in
├── tsconfig.json - TypeScript config
```

# Routes/Endpoints
Generally, the response for each route that returns responses is in the { data, error } format also used by Supabase.

POST routes that accept body data can either receive it as a ```application/x-www-form-urlencoded```,  ```multipart/form-data```, or ```application/json``` Content-Type, except for the ```/seed```, ```/delete-multiple-users```, and all ```/otp``` routes, which accept only ```application/json``` as the Content-Type.  Hono uses different parsing functions for a form data body and a raw JSON body, which is why this distinction must be made.

## Email/Password
### **POST** /email-password/signup
Create a new user in the database with id, email, and hashed password

Accepted input body:
```
{
  id?: UUID,
  email: string (email address),
  password: string
}
```
id is an optional field.  If the id field is left off the body, a random UUID will be generated using the uuid package.  The optional id field allows for a fixed id when seeding the database for consistency in testing.

Returns:
```
{
  data: user: {
    {
      id: string (UUID),
      email: string (e-mail address)
    }
  } | null,
  error
  : errors.userAlreadyExists | errors.internalServerError | null }
```

### **POST** /email-password/login
Login a user, uses bcrypt to compare the supplied password with the user's hashed password in the database.  If the passwords match, a session is created and the session info is returned to the authenticated uesr.  If the passwords do not match, no session is created and an error is returned to the user.

Accepted input body:
```
{
  email: string (e-mail address),
  password: string
}
```
Returns:
```
{
  data: user: {
    {
      id: string (UUID),
      email: string (e-mail address)
    }
  } | null,
  error:
    errors.internalServerError |
    errors.invalidCredentials |
    errors.userNotFound |
    null
}
```

### **POST** /email-password/change-password
Takes in a JSON body with an email address, and the new password, and changes the password for the user associated with that email addressto the new password in the database.

Accepted body format:
```
  {
    email: string (e-mail address),
    newPassword: string,
  },
```

Returns:
```
  {
    data: null,
    error: error | null
  }
```

## Session-related
### **POST** /session/logout
Logs the current user out and clears the current session.

### **GET** /session/get-current-session
Retrieves the current session from the session.json file.

Returns:
```
{
  data: { user:
    {
      id: string (UUID),
      email: string (e-mail address)
    }
  } | null,
  error: errors.internalServerError | null
}
```

## Admin
### **POST** /admin/seed
Takes in an array of user ```{ id?, email, password }``` objects as a string. ```JSON.parse()```s the string to an array, then adds each user to the database if the user doesn't already exist.

Accepted body format:
```
[
  {
    id: string (UUID),
    email: string (e-mail address),
    password: string,
  },
  {
    id: string (UUID),
    email: string (e-mail address),
    password: string,
  },
  etc.
]
```

Returns:
```
[
  all sucessfully added objects above
]
```
Unlike the other routes, the Content-Type for this route must be ```application/json```.

### **DELETE** /admin/delete-user/:userId

Deletes a single user by ID.
**USE WITH CAUTION.  THE DELETION IS PERMANENT AND CAN'T BE REVERSED**

Accepted URL Param: :userId - user ID of the user to delete

Returns:
```
{
  data: null,
  error: errors.internalServerError | null
}
```

### **DELETE** /admin/delete-multiple-users

Deletes multiple users according to an array of IDs.
**USE WITH CAUTION.  THE DELETIONS ARE PERMANENT AND CAN'T BE REVERSED**

Accepted input body:
string[] - array of IDs to delete

Returns:
```
{
  data: null,
  error: errors.internalServerError | null
}
```

### **DELETE** /admin/clear

Deletes every user in the database
**USE WITH CAUTION.  THE DELETIONS ARE PERMANENT AND CAN'T BE REVERSED**

Returns:
```
{
  data: null,
  error: errors.internalServerError | null
}
```

### **GET** /admin/get-id-by-email

Retrieves the ID of a user by their email address.

Accepted query param: `email` - the email address of the user to look up

Example: `/admin/get-id-by-email?email=user@example.com`

Returns:
```
{
  data: { id: string (UUID) } | null,
  error: errors.userNotFound | errors.internalServerError | null
}
```

## Phone
### **POST** /phone/signup
Create a new user in the database with id, phone number, and a generated OTP.  An OTP is generated automatically on signup and must be verified via the ```/otp/verify-otp``` route before the user can log in.

Accepted input body:
```
{
  id?: string (UUID),
  phoneNumber: string,
  staticOTP?: string
}
```
id is an optional field.  If the id field is left off the body, a random UUID will be generated.  staticOTP is an optional field that allows a fixed OTP value for consistent test results.

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      phoneNumber: string
    }
  } | null,
  error: errors.userAlreadyExists | errors.internalServerError | null
}
```

### **POST** /phone/login
Log in a user by phone number.  The user's OTP must have been previously verified via ```/otp/verify-otp``` for login to succeed.

Accepted input body:
```
{
  phoneNumber: string
}
```

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      phoneNumber: string
    }
  } | null,
  error: errors.internalServerError | errors.invalidCredentials | errors.userNotFound | null
}
```

## Email-Passwordless
### **POST** /email-passwordless/signup
Create a new user in the database with id, email, and a generated OTP.  An OTP is generated automatically on signup and must be verified via the ```/otp/verify-otp``` route before the user can log in.

Accepted input body:
```
{
  id?: string (UUID),
  email: string (email address),
  staticOTP?: string
}
```
id is an optional field.  If the id field is left off the body, a random UUID will be generated.  staticOTP is an optional field that allows a fixed OTP value for consistent test results.

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      email: string (email address)
    }
  } | null,
  error: errors.userAlreadyExists | errors.internalServerError | null
}
```

### **POST** /email-passwordless/login
Log in a user by email without a password.  The user's OTP must have been previously verified via ```/otp/verify-otp``` for login to succeed.

Accepted input body:
```
{
  email: string (email address)
}
```

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      email: string (email address)
    }
  } | null,
  error: errors.internalServerError | errors.invalidCredentials | errors.userNotFound | null
}
```

## OAuth
### **POST** /oauth/signup/:provider
Create a new user in the database via OAuth.  The provider is passed as a URL parameter.

Accepted URL param: :provider - the OAuth provider (e.g. ```google```, ```github```, etc.)

Accepted input body:
```
{
  id?: string (UUID),
  email: string (email address)
}
```
id is an optional field.  If the id field is left off the body, a random UUID will be generated.

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      email: string (email address)
    }
  } | null,
  error: errors.userAlreadyExists | errors.internalServerError | null
}
```

### **POST** /oauth/login/:provider
Log in a user via OAuth.  The provider is passed as a URL parameter.

Accepted URL param: :provider - the OAuth provider (e.g. ```google```, ```github```, etc.)

Accepted input body:
```
{
  email: string (email address)
}
```

Returns:
```
{
  data: {
    session: {
      id: string (UUID),
      email: string (email address)
    }
  } | null,
  error: errors.internalServerError | errors.userNotFound | null
}
```

## OTP
OTP routes accept only ```application/json``` as the Content-Type.

### **POST** /otp/assign-otp
Assign a new OTP to an existing user, optionally with a static value for consistent test results.

Accepted input body:
```
{
  providerType: 'email-password' | 'email-passwordless' | 'phone' | 'oauth',
  email?: string (email address),
  phoneNumber?: string,
  staticOTP?: string
}
```

Returns:
```
{
  data: 'ok' | null,
  error: error | null
}
```

### **POST** /otp/verify-otp
Verify a user's OTP.  A successful verification allows the user to log in via phone or email-passwordless routes.

Accepted input body:
```
{
  providerType: 'email-password' | 'email-passwordless' | 'phone' | 'oauth',
  email?: string (email address),
  phoneNumber?: string,
  staticOTP?: string,
  otp: string
}
```

Returns:
```
{
  data: 'ok' | null,
  error: error | null
}
```

### **POST** /otp/clear-otp
Clear the OTP for a user by their ID.

Accepted input body:
```
{
  id: string (UUID)
}
```

Returns:
```
{
  data: null,
  error: error | null
}
```

### **POST** /otp/show-otp
Retrieve the current OTP for a user, identified by their email or phone number and provider type.  Primarily useful in testing to retrieve an OTP without having to mock a real OTP delivery service.

Accepted input body:
```
{
  userIdentifier: string (user's email or phone number),
  providerType: 'email-password' | 'email-passwordless' | 'phone' | 'oauth'
}
```

Returns:
```
{
  data: {
    email?: string (email address),
    phoneNumber?: string,
    otp?: string
  } | null,
  error: error | null
}
```

# Mockabase Client

The Mockabase client is a thin abstraction over some of the API routes used most by frontends that mimics the Supabase client's API.

## Client Installation
Copy the following files into their corresponding folders in your frontend project:
```
  mockabaseClient.ts - the main client file
  typedFetch.ts - typedFetch function, a type-safe wrapper around the fetch API used by the Mockabase Client
  MockabaseUserReturnObject.ts - the ReturnObject type used by most routes
  User.ts - the User type used by the Session type below
  Session.ts - the Session type used by the ReturnObject type
  OAuthProvider.ts - the OAuthProvider type used by the OAuth routes
```

## Client Usage
Create a client with the following line of code:
```
const mockabaseClient = createMockabaseClient({ mockabaseUrl: 'FILL_ME_IN' });
```

The Mockabase client takes in the URL on which you have the Mockabase server running and returns an object with several functions that mimic the Supabase client API and correspond to Mockabase routes.

Returns the following object with several functions that mirror the above API routes, taking in the same inputs and returning the same data.

### Client Object Shape
```
{
  url: string;
  auth: { // as of version 3.0, all auth functions are under this auth object
    getUser(): Function - Corresponding route: /session/get-current-session,
    getSession(): Function - Corresponding route: /session/get-current-session,
    signInWithPassword(args: { email: string, password: string }): Function - Corresponding route: /email-password/login,
    signUpWithPassword(args: { id?: string, email: string, password: string }): Function - Corresponding route: /email-password/signup,
    updateUser(args: { email: string, newPassword: string }): Function - Corresponding route: /email-password/change-password,
    signInWithOAuth(args: { email: string, provider: OAuthProvider }): Function - Corresponding route: /oauth/login/:provider,
    signUpWithOAuth(args: { email: string, provider: OAuthProvider }): Function - Corresponding route: /oauth/signup/:provider,
    signInWithPhone(args: { phoneNumber: string }): Function - Corresponding route: /phone/login,
    signUpWithPhone(args: { id?: string, phoneNumber: string, staticOTP?: string }): Function - Corresponding route: /phone/signup,
    signInWithEmailPasswordless(args: { email: string }): Function - Corresponding route: /email-passwordless/login,
    signUpWithEmailPasswordless(args: { id?: string, email: string, staticOTP?: string }): Function - Corresponding route: /email-passwordless/signup,
    assignOtp(args: { providerType: Provider, email?: string, phoneNumber?: string, staticOTP?: string }): Function - Corresponding route: /otp/assign-otp,
    verifyOtp(args: { providerType: Provider, email?: string, phoneNumber?: string, staticOTP?: string, otp: string }): Function - Corresponding route: /otp/verify-otp,
    clearOtp(id: string): Function - Corresponding route: /otp/clear-otp,
    showOtp(args: { userIdentifier: string, providerType: Provider }): Function - Corresponding route: /otp/show-otp,
    signOut(): Function - Corresponding route: /session/logout,
    getIdByEmail(email: string): Function - Corresponding route: /admin/get-id-by-email
  }
}
```

These functions are called within your frontend as you would do with the Supabase client:

Example:
```
const login = async (args: { email: string, password: string }) => {
  const mockabaseClient = createMockabaseClient({ mockabaseUrl: process.env.MOCKABASE_URL });

  try {
    const response = await mockabaseClient.auth.signInWithPassword(args);

    const { data, error } = response;

    if (error) {
      console.error(error);
      return {
        data: null,
        error
      }
    }

    return {
      data,
      error: null
    }
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: errors.internalServerError
    }
  }
}
```

# Stack
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Runtime**: [Node](https://nodejs.org/)
* **Database**: [SQLite](https://sqlite.org/)
* **Backend Framework**: [Hono](https://hono.dev/)
* **Hash/Encryption Library**: [BCrypt](https://www.npmjs.com/package/bcrypt)
* **SQLite Client**: [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)
* **Type-safe ORM**: [Drizzle ORM](https://orm.drizzle.team)
* **Error-handling library**: [dataerror](https://www.npmjs.com/package/dataerror)
* **Testing**: [Vitest](https://vitest.dev/)

Node is used instead of Deno, Bun, or other runtimes for maximum compatibility with everyone's use.

Mockabase uses TypeScript.  Any PRs removing TypeScript from the codebase will be rejected.

Any PRs changing the stack substantially will require a detailed justification for doing so.
