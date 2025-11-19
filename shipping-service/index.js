const express = require('express');
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'shipping-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

// Connect to Kafka
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Shipping Service: Kafka producer connected');
  } catch (error) {
    console.error('Shipping Service: Failed to connect producer', error);
    setTimeout(connectProducer, 5000);
  }
};

connectProducer();

// Create shipping order endpoint
app.post('/shipping', async (req, res) => {
  try {
    const randomUuid = uuidv4();

    const shippingOrder = {
      shippingId: `Shipping-${randomUuid}`,
      userId: req.body.userId,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode,
      country: req.body.country,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    // Publish shipping created event to Kafka
    await producer.send({
      topic: 'shipping-events',
      messages: [{
        key: shippingOrder.shippingId,
        value: JSON.stringify({
          eventType: 'SHIPPING_CREATED',
          data: shippingOrder
        })
      }]
    });

    console.log(`Shipping order created: ${shippingOrder.shippingId}`);
    res.status(201).json({ message: 'Shipping order created', shippingOrder });
  } catch (error) {
    console.error('Error creating shipping order:', error);
    res.status(500).json({ error: 'Failed to create shipping order' });
  }
});

// Get shipping orders endpoint (mock)
app.get('/shipping', (req, res) => {
  res.json({ message: 'shipping endpoint', service: 'shipping-service' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'shipping-service' });
});

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`Shipping Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await producer.disconnect();
  process.exit(0);
});
