#include <WiFi.h>
#include <PubSubClient.h>

// --- WiFi credentials ---
const char* ssid = "nama wifi";
const char* password = "password wifi";

// --- MQTT Broker ---
const char* mqtt_server = "ip local";
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_pass = "";

// --- MQTT Topics ---
const char* topic_pub = "esp32/potensio"; 

// --- Pin Configuration ---
// #define POT_PIN 35         // Potensiometer (ADC input)
#define POT_PIN 34
#define ALARM_RELAY_PIN 23 // 

WiFiClient espClient;
PubSubClient mqtt_client(espClient);

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");

  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);
}

void connectToMQTT() {
  while (!mqtt_client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    if (mqtt_client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      // Tidak perlu subscribe jika hanya publish
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt_client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(ALARM_RELAY_PIN, OUTPUT);
  digitalWrite(ALARM_RELAY_PIN, LOW); // default alarm mati

  pinMode(POT_PIN, INPUT);

  connectToWiFi();

  mqtt_client.setServer(mqtt_server, mqtt_port);
  mqtt_client.setCallback(mqttCallback);
}

void loop() {
  if (!mqtt_client.connected()) {
    connectToMQTT();
  }
  mqtt_client.loop();

  // Membaca nilai mentah potensiometer: 0 - 4095
  int potValue = analogRead(POT_PIN); 
  
  // Konversi nilai ke skala yang diinginkan
  float voltage = (potValue / 4095.0) * 3.3; 
  float temperature = voltage * (100.0 / 3.3); // Skala 0-100 (dianggap Celcius)
  float smokeLevel = potValue / 40.95;         // Skala 0-100 (%)

  // Logika Fuzzy (IF-ELSE) untuk menentukan 'dangerStatus' untuk dikirim ke dashboard
  String dangerStatus;
  
  bool tempNormal = temperature < 45.0;
  bool tempTinggi = temperature >= 45.0 && temperature < 60.0;
  bool tempSangatTinggi = temperature >= 60.0;

  bool asapRendah = smokeLevel < 30.0;
  bool asapSedang = smokeLevel >= 30.0 && smokeLevel < 70.0;
  bool asapPekat = smokeLevel >= 70.0;

  if (tempSangatTinggi || asapPekat) {
    dangerStatus = "BAHAYA";
  }
  else if (tempTinggi && asapSedang) {
    dangerStatus = "BAHAYA";
  }
  else if (tempTinggi || asapSedang) {
    dangerStatus = "WASPADA";
  }
  else { 
    dangerStatus = "AMAN";
  }
  
  // Kontrol Relay hanya berdasarkan nilai mentah potensiometer
  if (potValue > 200) {
    digitalWrite(ALARM_RELAY_PIN, HIGH); // Nyalakan relay
  } else {
    digitalWrite(ALARM_RELAY_PIN, LOW);  // Matikan relay
  }

  // Membuat payload JSON untuk dikirim melalui MQTT
  String payload = "{\"temperature\":" + String(temperature, 1) +
                   ",\"smoke_level\":" + String(smokeLevel, 1) + 
                   ",\"danger_status\":\"" + dangerStatus + "\"}"; 

  // Publikasi data ke MQTT Broker
  mqtt_client.publish(topic_pub, payload.c_str());
  
  // Menampilkan data yang dikirim ke Serial Monitor untuk debugging
  Serial.println("Published: " + payload);
  Serial.print("Raw Potentiometer Value: "); 
  Serial.print(potValue);
  Serial.print(" | Relay Status: ");
  Serial.println(digitalRead(ALARM_RELAY_PIN) == HIGH ? "ON" : "OFF");
  
  delay(2000);
}