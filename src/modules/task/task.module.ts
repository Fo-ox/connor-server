import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task-entity';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskEntity]),
        BullModule.registerQueue({
            name: 'connorCore',
        }),
    ],
    controllers: [TaskController],
    providers: [
        TaskService,
    ],
    exports: [TaskService]
})
export class TaskModule {}
