const prisma = require('../lib/prisma');

class StateHandler {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async setState(userId, state, context = {}) {
        await this.prisma.user.update({
            where: { phoneNumber: userId },
            data: {
                currentState: state,
                lastInteraction: new Date()
            }
        });
    }

    async getState(userId) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: userId },
            select: { currentState: true }
        });
        return user?.currentState || 'IDLE';
    }

    async hasState(userId) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: userId },
            select: { currentState: true }
        });
        return user?.currentState != null;
    }

    async clearState(userId) {
        await this.prisma.user.update({
            where: { phoneNumber: userId },
            data: { currentState: null }
        });
    }   

    async isInOnboarding(userId) {
        const state = await this.getState(userId);
        return state === 'ONBOARDING';
    }

    async isInConversation(userId) {
        const state = await this.getState(userId);
        return state === 'IN_CONVERSATION';
    }

    async isInCheckIn(userId) {
        const state = await this.getState(userId);
        return state === 'CHECKIN';
    }
}

module.exports = StateHandler; 