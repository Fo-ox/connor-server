import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task-entity';
import { NormalizeTaskEntity } from './entities/normalize-task-entity';
import { BullModule } from '@nestjs/bull';
import { JobProcessor } from '../../jobs/job.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskEntity]),
        TypeOrmModule.forFeature([NormalizeTaskEntity]),
        BullModule.registerQueue({
            name: 'connorCore',
        })
    ],
    controllers: [TaskController],
    providers: [TaskService, JobProcessor]
})
export class TaskModule {}
