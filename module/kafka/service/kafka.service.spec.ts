import { Test, TestingModule } from '@nestjs/testing';
import { DD, HH, mm, MM, ss, SSS, YYYY } from 'app/constants/regex';
import { LoggerModule } from 'app/service';
import { KafkaMessageFactory, KafkaService } from 'module/kafka';

const mockModuleOptions = {
  client: {
    clientId: 'kafka_client_id_test',
    brokers: ['kafka_broker_test'],
  },
  consumer: {
    groupId: 'kafka_consumer_group_id_test',
  },
};

describe('kafka.service', () => {
  let service: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      providers: [
        {
          provide: 'KafkaModuleOptionsInterface',
          useValue: mockModuleOptions,
        },
        {
          provide: 'KafkaMessageFactoryInterface',
          useClass: KafkaMessageFactory,
        },
        KafkaService,
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
  });

  test('Should be defined.', () => {
    expect(service).toBeDefined();
  });

  test('Should create standardized message.', async () => {
    const options = {
      topic: 'kafka.topic.test',
      traceId: 'uuid-traceId-test',
      eventId: 'uuid-eventId-test',
      data: {
        ping: 'pong',
      },
    };
    const actual = await service.createMessage(options);

    expect(actual).toStrictEqual(
      expect.objectContaining({
        timestamp: expect.any(Number),
        dateTime: expect.stringMatching(
          new RegExp(`^${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}\\.${SSS}Z$`),
        ),
        ...options,
      }),
    );
  });
});
