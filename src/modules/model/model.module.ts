import { forwardRef, Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { TaskModule } from '../task/task.module';
import { BullModule } from '@nestjs/bull';
import { JobProcessor } from '../../jobs/job.processor';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelEntity } from './entities/model-entity';
import { ModelVariablesEntity } from './entities/model-variables.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ModelEntity]),
        TypeOrmModule.forFeature([ModelVariablesEntity]),
        BullModule.registerQueue({
            name: 'connorCore',
        }),
        UserModule,
        forwardRef(() => TaskModule),
    ],
    controllers: [ModelController],
    providers: [
        ModelService,
        JobProcessor,
    ],
    exports: [ModelService]
})
export class ModelModule {}
