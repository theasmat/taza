import { Kafka, Producer, Consumer } from 'kafkajs';
import { config } from './config';

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS,
  retry: {
    retries: 3,
    initialRetryTime: 100,
    factor: 2
  }
});

export const kafkaProducer: Producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
  retry: {
    retries: 3,
    initialRetryTime: 100
  }
});

export async function initializeMessaging() {
  try {
    await kafkaProducer.connect();
    console.log('Kafka producer connected successfully');
  } catch (error) {
    console.error('Error connecting Kafka producer:', error);
    throw error;
  }
}

export async function shutdownMessaging() {
  try {
    await kafkaProducer.disconnect();
    console.log('Kafka producer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka producer:', error);
  }
}