import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { AbstractEntity } from '~/common/entity/abstract.entity'

import { TaskEntity } from '../../task/task.entity'
import { CommonFlag } from '~/common/type'

@Entity({ name: 'sys_task_log' })
export class TaskLogEntity extends AbstractEntity {
  @Column({ type: 'tinyint', default: CommonFlag.FALSE, enum: CommonFlag, enumName: 'CommonFlag' })
  @ApiProperty({ description: '任务状态：0失败，1成功', enum: CommonFlag, enumName: 'CommonFlag' })
  status: CommonFlag

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '任务日志信息' })
  detail: string

  @Column({ type: 'int', nullable: true, name: 'consume_time', default: 0 })
  @ApiProperty({ description: '任务耗时' })
  consumeTime: number

  @ManyToOne(() => TaskEntity)
  @JoinColumn({ name: 'task_id' })
  task: Relation<TaskEntity>
}
