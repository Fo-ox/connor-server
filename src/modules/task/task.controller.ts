import { Body, Controller, Get, Post } from '@nestjs/common';
import { TaskDto } from './dto/task.dto';

@Controller('task')
export class TaskController {

    private JIRA_AUTOMATION;

    @Post('/create')
    createTask(@Body() newTask: TaskDto): any {
        this.JIRA_AUTOMATION = newTask;
        return newTask;
    }

    @Get()
    getTasks(): any {
        return this.JIRA_AUTOMATION
    }
}
