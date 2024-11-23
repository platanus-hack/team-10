class StateHandler {
    constructor() {
        this.userStates = new Map();
        this.userContext = new Map();
    }

    setState(userId, state, context = {}) {
        this.userStates.set(userId, state);
        this.userContext.set(userId, {
            ...context,
            lastStateChange: new Date()
        });
    }

    getState(userId) {
        return this.userStates.get(userId) || 'IDLE';
    }

    getContext(userId) {
        return this.userContext.get(userId) || {};
    }

    hasState(userId) {
        return this.userStates.has(userId);
    }

    clearState(userId) {
        this.userStates.delete(userId);
        this.userContext.delete(userId);
    }

    isInOnboarding(userId) {
        const state = this.getState(userId);
        return state.startsWith('ONBOARDING_');
    }

    isInConversation(userId) {
        return this.getState(userId) === 'IN_CONVERSATION';
    }
}

module.exports = StateHandler; 