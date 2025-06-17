const mqtt = require('mqtt');
const admin = require('firebase-admin');

// --- INISIALISASI FIREBASE ADMIN SDK ---
// Pastikan nama file JSON-nya sesuai
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Dapatkan referensi ke database Firestore
const db = admin.firestore();
console.log('✅ Firebase Admin SDK Initialized!');

// --- KONEKSI KE MQTT BROKER ---
const mqttBroker = 'mqtt://172.20.10.3'; // Ganti dengan IP broker Anda
const mqttTopic = 'esp32/potensio';       // Topik yang akan didengarkan

const client = mqtt.connect(mqttBroker);

client.on('connect', () => {
    console.log('✅ MQTT Connected!');
    client.subscribe(mqttTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${mqttTopic}`);
        }
    });
});

client.on('message', async (topic, message) => {
    if (topic === mqttTopic) {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received data:', data);

            const res = await db.collection('data_points').add({
                temperature: data.temperature, 
                smoke_level: data.smoke_level,                 
                danger_status: data.danger_status,   
                // Gunakan timestamp dari server Firebase untuk akurasi
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('Data saved to Firestore with ID:', res.id);

        } catch (error) {
            console.error('Failed to parse or save data:', error);
        }
    }
});