import {IPluginLoader, ILogger, IConfig, IEventBus, IStatsTarget} from '@homenet/core';
import * as librato from 'librato-node';

interface ILibratoConfig extends IConfig {
  librato: {
    email: string;
    token: string;
  }
}

export function create(annotate: any): { LibratoPluginLoader: new(...args: any[]) => IPluginLoader } {
  @annotate.plugin()
  class LibratoPluginLoader implements IStatsTarget {
    constructor(
      @annotate.service('IConfig') private config: ILibratoConfig,
      @annotate.service('ILogger') private logger: ILogger,
      @annotate.service('IEventBus') private eventBus: IEventBus
    ) {
      librato.configure({ email: config.librato.email, token: config.librato.token });
    }

    load() : void {
      librato.start();
      this.logger.info('Loading Librato');

      this.eventBus.on('value.*.*', '*', e => {
        this.gauge(e.name, e.data);
      });
      this.eventBus.on('presence.*.*', '*', e => {
        this.gauge(e.name, e.data ? 1 : 0);
      });
      this.eventBus.on('trigger.*.*', 'triggered', e => {
        this.counter(e.name);
      });
    }

    gauge(id: string, value: number) : void {
      librato.measure(id, value);
    }

    counter(id: string, increment?: number) : void {
      librato.increment(id, increment);
    }
  }

  return { LibratoPluginLoader };
}
