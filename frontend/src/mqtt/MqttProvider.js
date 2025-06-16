import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { DateTime } from 'luxon';

const MqttContext = createContext(null);

export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (!context) {
        throw new Error('useMqtt must be used within an MqttProvider');
    }
    return context;
};

export const MqttProvider = ({ children }) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const [stTank, setStTank] = useState(false);
    const [stSprinkler, setStSprinkler] = useState(false);

    // Sekarang akan menampilkan nilai yang sudah diskalakan (0-100) dari ESP32
    const [temperature, setTemperature] = useState('--');
    const [humidity, setHumidity] = useState('--');

    const [datetimeArray, setDatetimeArray] = useState([]);
    const [humArray, setHumArray] = useState([]);
    const [tempArray, setTempArray] = useState([]);

    const [lampStatus, setLampStatus] = useState('--');

    const brokerUrl = 'ws://192.168.247.206:9001';
    const topicEsp32SensorData = 'esp32/potensio';
    const topicEsp32ControlCommands = 'esp32/control';

    useEffect(() => {
        if (!clientRef.current) {
            console.log(`Attempting to connect to MQTT broker: ${brokerUrl}`);
            const mqttClient = mqtt.connect(brokerUrl, {
                reconnectPeriod: 1000,
                clientId: `react-app-${Math.random().toString(16).substr(2, 8)}`
            });

            mqttClient.on('connect', () => {
                console.log('MQTT Connected!');
                setIsConnected(true);
                mqttClient.subscribe(topicEsp32SensorData, (err) => {
                    if (!err) {
                        console.log(`Subscribed to ${topicEsp32SensorData}`);
                    } else {
                        console.error(`Subscription error for ${topicEsp32SensorData}:`, err);
                    }
                });
            });

            mqttClient.on('message', (topic, message) => {
                if (topic === topicEsp32SensorData) {
                    try {
                        const data = JSON.parse(message.toString());

                        // ✅ Menggunakan nilai "temperature" dan "humidity" yang sudah diskalakan dari ESP32
                        const currentTemp = data.temperature ? parseFloat(data.temperature).toFixed(1) : '--';
                        const currentHum = data.humidity ? parseFloat(data.humidity).toFixed(1) : '--';

                        // ✅ Menggunakan "lamp_status" langsung dari ESP32
                        const receivedLampStatus = data.lamp_status ? data.lamp_status : '--';

                        setTemperature(currentTemp);
                        setHumidity(currentHum);
                        setLampStatus(receivedLampStatus); // Set status lampu langsung

                        // Update grafik
                        const now = DateTime.now().setZone('Asia/Jakarta');
                        setDatetimeArray(prev => [...prev.slice(-7), now.toFormat("HH:mm:ss")]);
                        setTempArray(prev => [...prev.slice(-7), parseFloat(currentTemp)]);
                        setHumArray(prev => [...prev.slice(-7), parseFloat(currentHum)]);

                    } catch (e) {
                        console.error("Failed to parse incoming MQTT message:", e);
                    }
                }
            });

            mqttClient.on('error', (err) => {
                console.error('MQTT Error:', err);
                setIsConnected(false);
                clientRef.current = null;
            });

            mqttClient.on('close', () => {
                console.log('MQTT connection closed.');
                setIsConnected(false);
                clientRef.current = null;
            });

            clientRef.current = mqttClient;
        }

        return () => {
            if (clientRef.current) {
                console.log('Disconnecting MQTT client on unmount...');
                clientRef.current.end();
                clientRef.current = null;
            }
        };
    }, []); // Dependensi kosong, hanya dijalankan sekali saat komponen dimuat

    const publishControl = (device, state) => {
        if (clientRef.current && isConnected) {
            const messageToSend = state === 1 ? "ON" : "OFF";
            clientRef.current.publish(topicEsp32ControlCommands, messageToSend, (err) => {
                if (err) {
                    console.error(`Failed to publish control message for ${device}:`, err);
                } else {
                    console.log(`Published to ${topicEsp32ControlCommands}: ${messageToSend} for ${device}`);
                    if (device === 'pumpTank') {
                        setStTank(state === 1);
                    } else if (device === 'pumpSprinkler') {
                        setStSprinkler(state === 1);
                    }
                }
            });
        } else {
            console.warn('MQTT client not connected. Cannot publish control message.');
        }
    };

    return (
        <MqttContext.Provider value={{
            isConnected,
            temperature,
            humidity,
            datetimeArray,
            tempArray,
            humArray,
            stTank,
            stSprinkler,
            lampStatus, // ✅ Sudah termasuk dalam nilai konteks
            publishControl,
        }}>
            {children}
        </MqttContext.Provider>
    );
};