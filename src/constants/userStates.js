const UserStates = {
  // Base state
  IDLE: 'IDLE',
  
  // Onboarding states
  ONBOARDING: 'ONBOARDING',
  
  // Active conversation (Claude handling)
  IN_CONVERSATION: 'IN_CONVERSATION',

  // Check-in states
  CHECKIN: 'CHECKIN',
};

module.exports = UserStates;