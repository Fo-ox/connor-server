import { Body, Controller, Post } from '@nestjs/common';
import { TaskDto } from './dto/task.dto';

@Controller('task')
export class TaskController {

    @Post('/create')
    createTask(@Body() newTask: TaskDto): any {
        console.log(newTask);
        return newTask;
    }
}
