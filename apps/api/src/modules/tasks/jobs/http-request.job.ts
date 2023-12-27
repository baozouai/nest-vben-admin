import { HttpService } from '@nestjs/axios'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'

import { Mission } from '../mission.decorator'

/**
 * Api接口请求类型任务
 */
@Injectable()
@Mission()
export class HttpRequestJob {
  private logger = new Logger(HttpRequestJob.name)
  constructor(
    private readonly httpService: HttpService,
  ) {}

  /**
   * 发起请求
   * @param config {AxiosRequestConfig}
   */
  async handle(config: unknown): Promise<void> {
    if (config) {
      const result = await this.httpService.request(config)
      result.subscribe(res => console.log(res))
    }
    else {
      throw new BadRequestException('Http request job param is empty')
    }
  }
}
