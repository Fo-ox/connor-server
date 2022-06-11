import { Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { TaskModule } from '../task/task.module';
import { BullModule } from '@nestjs/bull';
import { JobProcessor } from '../../jobs/job.processor';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'connorCore',
        }),
        UserModule,
        TaskModule,
    ],
    controllers: [ModelController],
    providers: [
        ModelService,
        JobProcessor,
    ],
    exports: [ModelService]
})
export class ModelModule {}
