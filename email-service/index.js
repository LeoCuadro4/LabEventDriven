const express = require('express');
const { Kafka } = require('kafkajs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3007;

// =======================
//  ENVIRONMENT VARIABLES
// =======================
const {
  KAFKA_BROKER,
  SERVICE_NAME,
  EMAIL_USER,
  EMAIL_PASS
} = process.env;

console.log("🔧 Configuración cargada:");
console.log("KAFKA_BROKER:", KAFKA_BROKER);
console.log("SERVICE_NAME:", SERVICE_NAME);
console.log("EMAIL_USER:", EMAIL_USER);

// =======================
//  HEALTH CHECK
// =======================
app.get('/health', (req, res) => {
  res.status(200).send("Email Service OK");
});

// =======================
//  EMAIL TRANSPORTER
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// =======================
//  KAFKA CONFIG
// =======================
const kafka = new Kafka({
  clientId: SERVICE_NAME,
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "email-service-group" });

async function startKafkaConsumer() {
  try {
    console.log("📨 Conectando consumidor de Kafka...");
    await consumer.connect();

    console.log("📡 Suscribiendo a topics...");
    await consumer.subscribe({ topic: "order-events", fromBeginning: false });
    await consumer.subscribe({ topic: "shipment-events", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const eventData = JSON.parse(message.value.toString());
        console.log(`📥 Evento recibido en ${topic}:`, eventData);

        // =======================
        // LÓGICA DE ENVÍO DE EMAIL
        // =======================
        if (eventData.customerEmail) {
          const mailOptions = {
            from: EMAIL_USER,
            to: eventData.customerEmail,
            subject: `Notificación: ${eventData.eventType}`,
            text: `Hola, tu evento ocurrió correctamente.\n\nDatos: ${JSON.stringify(eventData, null, 2)}`
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log("📧 Email enviado a:", eventData.customerEmail);
          } catch (err) {
            console.error("❌ Error enviando email:", err);
          }
        }
      }
    });

  } catch (err) {
    console.error("❌ Error conectando a Kafka:", err);
  }
}

startKafkaConsumer();

// =======================
//  START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🌐 Email Service corriendo en puerto ${PORT}`);
});
