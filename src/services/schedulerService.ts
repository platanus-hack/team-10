
import { HolidayService } from './holidayService';
import { CheckInService } from './checkInService';
import cron from 'node-cron';

export class SchedulerService {
    constructor(
        private holidayService: HolidayService,
        private checkInService: CheckInService,
        private activeConversations: Map<string, any>
    ) {}

    public startScheduledTasks(): void {
        // Run holiday checks daily at 9:00 AM
        cron.schedule('0 9 * * *', async () => {
            try {
                await this.holidayService.checkHolidays(this.activeConversations);
            } catch (error) {
                console.error('Error running holiday check:', error);
            }
        });

        // Run check-ins every minute
        cron.schedule('* * * * *', async () => {
            try {
                await this.checkInService.runMorningCheckIns(this.activeConversations);
                await this.checkInService.runEveningCheckIns(this.activeConversations);
            } catch (error) {
                console.error('Error running check-ins:', error);
            }
        });
    }
}