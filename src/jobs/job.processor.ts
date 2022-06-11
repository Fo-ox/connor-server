import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ModelService } from '../modules/model/model.service';

@Processor('connorCore')
export class JobProcessor {
    constructor(private modelService: ModelService) {
    }

    @Process('predictEstimate')
    async handleEstimate(job: Job) {
        this.modelService.predictEstimate(job.data?.task);
    }

    @Process('trainModel')
    async handleTrainModel(job: Job) {
        this.modelService.createNewModel(job.data?.modelType);
    }
}
