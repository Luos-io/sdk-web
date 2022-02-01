import { Service, ServiceOptions } from 'inspect/service/interfaces.js';

export type ServiceStatistics = {
  rx_msg_stack_ratio: number;
  luos_stack_ratio: number;
  tx_msg_stack_ratio: number;
  buffer_occupation_ratio: number;
  msg_drop_number: number;
  max_loop_time_ms: number;
  max_retry: number;
};

export interface ServiceStatisticsData {
  protocol: number;
  target: number;
  mode: number;
  source: number;
  command: number;
  size: number;
  statistics: ServiceStatistics | null;
}

export interface IServiceStatistics {
  (
    id: Service['ID'],
    port: SerialPort,
    options?: ServiceOptions,
  ): Promise<ServiceStatisticsData>;
}
