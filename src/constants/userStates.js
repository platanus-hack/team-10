const UserStates = {
  // Base state
  IDLE: 'IDLE',
  
  // Onboarding states
  ONBOARDING_NAME: 'ONBOARDING_NAME',
  ONBOARDING_RISK_TIMES: 'ONBOARDING_RISK_TIMES',
  ONBOARDING_COMPLETE: 'ONBOARDING_COMPLETE',
  
  // Active conversation (Claude handling)
  IN_CONVERSATION: 'IN_CONVERSATION',
};

module.exports = UserStates;