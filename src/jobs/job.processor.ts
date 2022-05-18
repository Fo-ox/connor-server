import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NormalizeTaskService } from '../modules/task/normalize-task.service';

@Processor('connorCore')
export class JobProcessor {
    constructor(private normalizeTaskService: NormalizeTaskService) {
    }

    private readonly logger = new Logger(JobProcessor.name);

    @Process('predictEstimate')
    async handleEstimate(job: Job) {
        this.normalizeTaskService.buildDataset();
    }
}
