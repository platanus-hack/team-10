class StateHandler {
    constructor() {
        this.userStates = new Map();
    }

    setState(userId, state) {
        this.userStates.set(userId, state);
    }

    getState(userId) {
        return this.userStates.get(userId);
    }

    hasState(userId) {
        return this.userStates.has(userId);
    }

    clearState(userId) {
        this.userStates.delete(userId);
    }
}

module.exports = StateHandler; 