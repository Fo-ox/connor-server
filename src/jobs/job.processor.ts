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
        console.log(`start predict for ${job.data?.task?.id}`);
        this.normalizeTaskService.predictEstimate(job.data?.task, job.data?.modelType || 'randomForest');
    }

    @Process('trainModel')
    async handleTrainModel(job: Job) {
        console.log('start training');
        console.log(job.data?.modelType)
        this.normalizeTaskService.createNewModel(job.data?.modelType);
    }
}
