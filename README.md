# Mockabase

Mockabase is a minimal open-source local offline mock authentication service that approximately mocks the Supabase API for use in automated testing and development.  I made Mockabase because I personally found Supabase hard to test with in development and found that I needed a mock service that would allow me to consistently create and delete test users without having several different real email addresses.  I personally believe it is ok to mock Supabase when doing automated tests of an app's functionality, as automated testing of live Supabase responses would be tantamount to testing Supabase itself, which the Supabase team has covered.  That said, of course, I recommend to do some manual acceptance testing of your app with live Supabase responses too.

## Disclaimers

**IMPORTANT: UNDER NO CIRCUMSTANCES SHOULD MOCKABASE BE USED IN PRODUCTION.  MOCKABASE IS NOT A PRODUCTION-READY AUTH SERVICE.  MOCKABASE IS STRICTLY FOR USE IN TESTING, PROTOTYPING, AND LOCAL DEVELOPMENT.  ANY USE OF MOCKABASE IN PRODUCTION IS NOT CONDONED BY THE CREATORS AND MAINTAINERS, IS AT YOUR OWN RISK, AND THE CREATORS AND MAINTAINERS OF MOCKABASE ARE NOT TO BE HELD LIABLE UNDER ANY CIRCUMSTANCES FOR LOSSES RELATED TO THE ILL-ADVISED USE OF THIS SERVICE IN PRODUCTION APPS.**

I am not affiliated with Supabase or the Supbase team in any way.  This service is not condoned, supported, or endorsed by Supabase or the Supabase team in any way.

I aimply wrote this to solve a problem I had with testing Supabase auth in my apps consistently and decided to open-source it in the hope that it would help other developers solve similar problems.  That's all.

This is not a commercial project and I'm not making money from it.  The name Supabase belongs to its creators.

# How does Mockabase work?
Mockabase uses a local database with a users table that loosely mocks the ```auth.users``` table in Supabase.  There are various routes for all expected user functions (including a mock "OAuth" login and signup) detailed in the routes section below.  "Sessions" are currently handled with a JSON file at the root of the project called ```session.json```, which is either null if logged out or has the id and e-mail of the current user if logged in.  I consider this an acceptable minimal way to mock sessions for testing and development purposes.

# Major breaking changes in version 2.0
```signup```, ```login```, and ```get-current-session``` routes now return objects in the following format:
```{ data: { user: User } | null, error: error | null } ```

This more closely mirrors the Supabase API.

Errors are now returned as Supabase-like error objects instead of strings, to more closely mirror the Supabase API.  For a complete reference of all error objects returned by Mockabase, see the ```src/data/errors.ts``` file.

# Installation

You must have the following installed locally to use Mockabase:
* Node
* POSTGRESQL

1.  Make sure you have [Node](https://nodejs.org/) and [Postgres](https://www.postgresql.org/) installed locally.

2.  Fork and/or clone the repository.

3.  Run ```npm install``` to install all dependencies.

4.  Set up a local Postgres database on your local machine according to the schema file in ```sql/schema.sql```.

5.  Create a ```.env``` file and set up all environment variables according to the ```.env.example``` file.  For the PORT number, I recommend using a port number you don't use for any other servers or services, since you'll likely be running Mockabase alongside of many other services.

6.  Create a ```testEnv.ts``` file in the ```tests/testEnv``` folder and set up all the ```testEnv``` variables according to the ```testEnv.example.ts``` file.  This is necessary because Vitest can not read ```process.env```.

7.  Create a user using the ```/signup``` route (very important to use the ```/signup``` route so you get a properly hashed password) for use with the mock OAuth function and fill out the corresponding environment variables in both ```.env``` and ```testEnv.ts``` accordingly.

8.  Run the server using ```npm run dev```.

9.  Run the tests using ```npm run test``` and confirm that they all pass.

# Tests
Mockabase has a comprehensive test suite written with Vitest and covering most of Mockabase' core functions.  Not all code is unit-tested, but almost all core functions except the ```/clear``` endpoint are covered by the tests.  Any new major features contributed must be accompanied by tests confirming they work and must not break any existing tests unless the feature in question is a major breaking feature.  In this case, the way the tests were broken and had to be refactored must be documented.

## Suggsted Usage
In your frontend, use an environment variable like ```NODE_ENV``` that is set to ```testing``` when it's time to test the app or prototype, then design your code to conditionally use Mockabase for authentication and authorization in all of your auth checks, login/logout functions, etc. only while the environment variable of your choice is set to ```testing``` or whatever you designate to be "testing mode".

Example:
```
if (process.env.NODE_ENV === 'testing') {
  const response = await fetch('http://localhost:4200/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'example@emil.com', password: 'example-password' }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const result = await response.json();

  const { data, error } = result;
} else {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'example@email.com',
    password: 'example-password',
  });
}
```

# Directory structure
```
mockabase
├── sql - the schema file used to build the local databse
├── src - source files
│   ├── data - data files used by the app like blank objects, the seed and test user data for the DB
│   ├── db - the file to initialize the DB
│   │   ├── models - all DB models (currently just for user)
│   ├── helper - helper functions for comparing passwords, hashing, fetching, etc.
│   ├── session - all functions for creating, deleting, and managing sessions
│   ├── typedefs - type definitions
│   ├── index.ts - the main file containing the server initialization and all the routes, the beating heart of Mockabase
├── tests - test directory
│   ├── testEnv - test environment (not committed to GitHub, must be created manually), and the template for creating the test environment manually)
│   ├── testFunctions - all reusable functions used in the tests
│   ├── core-functions.test.ts - test file for all Mockabase core functions
├── .env - environment variables (not committed to GitHub, must be created manually)
├── .env.example - environment variable template or creating .env
├── .gitignore - .gitignore file
├── CODE_OF_CONDUCT.md - contributor code of conduct
├── CONTRIBUTING.md - contributing guidelines
├── package.json - NPM package.json file
├── package-lock.json - NPM package-lock.json file
├── README.md - this file
├── session.json - JSON file that stores all mock "session" data - null if logged out, { id, email } of logged-in user if logged in
├── tsconfig.json - TypeScript config
```

# Routes/Endpoints
Generally, the response for each route that returns responses is in the { data, error } format also used by Supabase.

POST routes that accept body data can either receive it as a ```application/x-www-form-urlencoded```,  ```multipart/form-data```, or ```application/json``` Content-Type, except for the ```/seed``` and ```/delete-multiple-users``` routes, which accept only ```application/json``` as the Content-Type.  Hono uses different parsing functions for a form data body and a raw JSON body, which is why this distinction must be made.

### **POST** /signup
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

### **POST** /login
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

### **POST** /logout
Logs the current user out and clears the current session.

### **GET** /get-current-session
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

### **POST** /seed
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

### **POST** /mock-oauth/:provider
Mocks an OAuth login with an e-mail address and password pre-determined with the MOCK_OAUTH_EMAIL and MOCK_OAUTH_PASSWORD environment variables.

This route can functionally be used to mock both OAuth signup and OAuth login since they do the same thing in this local mock environment.

Accepted URL Param: :provider - 'facebook' | 'google' | 'apple' | 'github' - doesn't matter because the provider variable is not used

Returns:
```
{
  data: {
    id: string (UUID),
    email: string (e-mail address)
  } | null,
  error: errors.internalServerError | null
}
```

### **DELETE** /delete-user/:userId

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

### **DELETE** /delete-multiple-users

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

### **DELETE** /clear

Deletes every user in the database
**USE WITH CAUTION.  THE DELETIONS ARE PERMANENT AND CAN'T BE REVERSED**

Returns:
```
{
  data: null,
  error: errors.internalServerError | null
}
```

# Mockabase Client

The Mockabase client is a thin abstraction over some of the API routes used most by frontends that mimics the Supabase client's API.

## Client Installation
Move the following files into their corresponding folders in your frontend project.
```mockabaseClient.ts``` - the main client file
```typedFetch.ts``` - typedFetch function, a type-safe wrapper around the fetch API used by the Mockabase Client
```ReturnObject.ts``` - the ReturnObject type used by most routes
```OAuthProvider.ts``` - the OAuthProvider type used by the OAuth routes

## Client Usage
Create a client with the following line of code:
```
const mockabaseClient = createMockabaseClient({ mockabaseUrl: 'FILL_ME_IN' });
```

The Mockabase client takes in the URL on which you have the Mockabase server running and returns an object with several functions that mimic the Supabase client API and correspond to Mockabase routes.

Returns the following object with several functions that mirror the above API routes, taking in the same inputs and returning the same data.

```
{
  url: string;
  getUser(): Function - Corresponding route: /get-user-session,
  getSession(): Function - Corresponding route: /get-user-session,
  signInWithPassword(args: { email: string, password: string }): Function - Corresponding route: /login,
  signInWithOAuth(args: { provider: OAuthProvider }): Function - Corresponding route: /mock-oauth,
  signOut(): Function - Corresponding route: /logout,
  signUpWithPassword(args: { id: string, email: string, password: string }): Function - Corresponding route: /signup,
  signUpWithOAuth(args: { provider: OAuthProvider }): Function - Corresponding route: /mock-oauth,
}
```

These functions are called within your frontend as you would do with the Supabase client:

Example:
```
const login = async (args: { email: string, password: string }) => {
  const mockabaseClient = createMockabaseClient({ mockabaseUrl: process.env.MOCKABASE_URL });

  try {
    const response = await mockabaseClient.signInWithPassword(args);

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
* **Database**: [PostgreSQL](https://www.postgresql.org/)
* **Backend Framework**: [Hono](https://hono.dev/)
* **Hash/Encryption Library**: [BCrypt](https://www.npmjs.com/package/bcrypt)
* **Postgres Client**: [Postgres.js](https://github.com/porsager/postgres)
* **Testing**: [Vitest](https://vitest.dev/)

Node is used instead of Deno, Bun, or other runtimes for maximum compatibility with everyone's use.

Mockabase uses TypeScript.  Any PRs removing TypeScript from the codebase will be rejected.

Any PRs changing the stack substantially will require a detailed justification for doing so.
