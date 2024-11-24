const { generateUserContext } = require('./generateUserContext');

// Test user object
const testUser = {
  name: "María",
  age: 32,
  gender: "FEMALE",
  workStatus: "EMPLOYED",
  relationshipStatus: "MARRIED",
  homeStatus: "LIVES_WITH_FAMILY",
  sobrietyStartDate: "2024-11-23" // About 3 months ago from current date
};

// Test the function
const context = generateUserContext(testUser);
console.log(context);

// You can try different scenarios
const testUser2 = {
  name: "Carlos",
  age: 25,
  gender: "MALE",
  workStatus: "STUDENT",
  relationshipStatus: "SINGLE",
  homeStatus: "LIVES_WITH_ROOMMATES",
  sobrietyStartDate: "2024-11-10" // Recent date for days calculation
};

const context2 = generateUserContext(testUser2);
console.log(context2); 

const testUser3 = {
  name: "Juan",
  age: 40,
  gender: "PREFER_NOT_TO_SAY",
};

const context3 = generateUserContext(testUser3);
console.log(context3);

// Test edge case: Empty user object
const emptyUser = {};
const contextEmpty = generateUserContext(emptyUser);
console.log('Empty user:', contextEmpty);

// Test edge case: Null values
const nullUser = {
  name: null,
  age: null,
  gender: null,
  workStatus: null,
  relationshipStatus: null,
  homeStatus: null,
  sobrietyStartDate: null
};
const contextNull = generateUserContext(nullUser);
console.log('Null values:', contextNull);

// Test edge case: Invalid enum values
const invalidEnumUser = {
  name: "Alex",
  age: 28,
  gender: "INVALID_GENDER",
  workStatus: "NOT_A_WORK_STATUS",
  relationshipStatus: "INVALID_STATUS",
  homeStatus: "WRONG_HOME_STATUS",
  sobrietyStartDate: "2024-01-01"
};
const contextInvalid = generateUserContext(invalidEnumUser);
console.log('Invalid enums:', contextInvalid);

// Test edge case: Future sobriety date
const futureUser = {
  name: "Ana",
  age: 45,
  gender: "FEMALE",
  workStatus: "EMPLOYED",
  relationshipStatus: "DIVORCED",
  homeStatus: "LIVES_ALONE",
  sobrietyStartDate: "2025-01-01"
};
const contextFuture = generateUserContext(futureUser);
console.log('Future date:', contextFuture);

// Test edge case: Missing required fields but has optional ones
const partialUser = {
  sobrietyStartDate: "2024-01-01",
  homeStatus: "LIVES_ALONE"
};
const contextPartial = generateUserContext(partialUser);
console.log('Partial user:', contextPartial);
