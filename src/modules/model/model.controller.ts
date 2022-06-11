import { Controller, Get, Query } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
    constructor(
        @InjectQueue('connorCore') private estimateQueue: Queue,
        private modelService: ModelService,
    ) {
    }

    @Get('/train')
    trainModel(@Query() modelType): Promise<any> {
        console.log('train controller')
        return this.estimateQueue.add('trainModel', {
            modelType: modelType?.modelType
        })
    }
}
