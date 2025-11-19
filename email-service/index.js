const express = require("express");
const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");

const app = express();
const port = 3007;

// ========== Kafka Config ==========
const kafka = new Kafka({
  clientId: process.env.SERVICE_NAME || "email-service",
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: "email-service-group" });

// ========== Email Transporter ==========
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ========== Email Send Function ==========
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });

    console.log(`📧 Email enviado a ${to}: ${subject}`);
  } catch (err) {
    console.error("❌ Error enviando email:", err);
  }
}

// ========== Kafka Consumer ==========
async function startKafkaConsumer() {
  await consumer.connect();

  console.log("📨 Email Service conectado a Kafka...");

  await consumer.subscribe({ topic: "order-events", fromBeginning: false });
  await consumer.subscribe({ topic: "shipping-events", fromBeginning: false });

  console.log("📡 Escuchando topics: order-events, shipping-events");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());

      console.log(`📥 Evento recibido (${topic}):`, event);

      if (event.eventType === "order.created") {
        await sendEmail(
          event.customerEmail,
          "Confirmación de pedido",
          `Tu pedido ${event.orderId} fue registrado exitosamente.`
        );
      }

      if (event.eventType === "shipment.sent") {
        await sendEmail(
          event.customerEmail,
          "Pedido enviado",
          `Tu pedido ${event.orderId} ha sido enviado.`
        );
      }
    }
  });
}

// ========== Express Health Check ==========
app.get("/health", (req, res) => {
  res.send("Email Service OK");
});

// ========== Start Services ==========
app.listen(port, () => {
  console.log(`🌐 Email Service corriendo en puerto ${port}`);
});

startKafkaConsumer().catch(console.error);
