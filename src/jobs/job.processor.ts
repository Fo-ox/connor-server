import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('connorCore')
export class JobProcessor {
    private readonly logger = new Logger(JobProcessor.name);

    @Process()
    async handleEstimate(job: Job) {
        console.log(job.data);
    }
}
