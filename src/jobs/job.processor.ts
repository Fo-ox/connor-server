import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ModelService } from '../modules/model/model.service';

@Processor('connorCore')
export class JobProcessor {
    constructor(private modelService: ModelService) {
    }

    private readonly logger = new Logger(JobProcessor.name);

    @Process('predictEstimate')
    async handleEstimate(job: Job) {
        console.log(`start predict for ${job.data?.task?.id}`);
        this.modelService.predictEstimate(job.data?.task, job.data?.modelType || 'randomForest');
    }

    @Process('trainModel')
    async handleTrainModel(job: Job) {
        console.log('start training');
        console.log(job.data?.modelType)
        this.modelService.createNewModel(job.data?.modelType);
    }
}
