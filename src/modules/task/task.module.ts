import { forwardRef, Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task-entity';
import { BullModule } from '@nestjs/bull';
import { ModelModule } from '../model/model.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskEntity]),
        BullModule.registerQueue({
            name: 'connorCore',
        }),
        forwardRef(() => ModelModule),
    ],
    controllers: [TaskController],
    providers: [
        TaskService
    ],
    exports: [TaskService]
})
export class TaskModule {}
