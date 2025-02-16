import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Between, LessThan, Like, Repository } from 'typeorm'

import { paginate } from '~/helper/paginate'

import { TaskLogQueryDto } from '../dto/log.dto'
import { TaskLogEntity } from '../entities/task-log.entity'

@Injectable()
export class TaskLogService {
  constructor(
    @InjectRepository(TaskLogEntity)
    private taskLogRepository: Repository<TaskLogEntity>,
  ) {}

  async create(
    tid: number,
    status: number,
    consumeTime?: number,
    err?: string,
  ): Promise<number> {
    const result = await this.taskLogRepository.save({
      status,
      detail: err,
      consumeTime,
      task: { id: tid },
    })
    return result.id
  }

  async list({ name, detail, status,time, page, pageSize }: TaskLogQueryDto) {
    const queryBuilder = this.taskLogRepository
      .createQueryBuilder('task_log')
      .leftJoinAndSelect('task_log.task', 'task')
      .where({
        ...(name && { task: { name: Like(`%${name}%`) }}),
        ...(detail && { detail: Like(`%${detail}%`) }),
        ...(time && { createdAt: Between(...time) }),
        ...(status && { status }),
      })
      .orderBy('task_log.id', 'DESC')

    return paginate<TaskLogEntity>(queryBuilder, {
      page,
      pageSize,
    })
  }

  async clearLog(): Promise<void> {
    await this.taskLogRepository.clear()
  }

  async clearLogBeforeTime(time: Date): Promise<void> {
    await this.taskLogRepository.delete({ createdAt: LessThan(time) })
  }
}
