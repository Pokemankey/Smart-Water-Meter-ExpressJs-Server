#include <ArduinoHttpClient.h>
#include "WiFiS3.h"
#include "arduino_secrets.h"

int arduinoID = 1;
char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;
int sensorPin = 2;
volatile long pulse;
volatile long litres;
char serverAddress[] = "16.171.55.236";  // server address
int port = 8080;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverAddress, port);
int status = WL_IDLE_STATUS;

void setup() {
  Serial.begin(115200);
    pinMode(sensorPin, INPUT);
    attachInterrupt(digitalPinToInterrupt(sensorPin), increase, RISING);
  while (!Serial) {
    ;
  }

  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    while (true);
  }

  String fv = WiFi.firmwareVersion();
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("Please upgrade the firmware");
  }

  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    status = WiFi.begin(ssid, pass);
    delay(10000);
  }

  printWifiStatus();
}


void loop() {
  Serial.println("making GET request");
  Serial.println(pulse);
  if (client.connect(serverAddress, 3306)) {
    Serial.println("Connected to server");
    litres = pulse / 280;
    String x = String("GET /addWaterUsageEntry/")+ litres +String("/")+arduinoID + String(" HTTP/1.1");
    client.println(x);
    client.println("Host: 16.171.55.236");
    client.println("Connection: close");
    client.println();
    int statusCode = client.responseStatusCode();
    String response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  if(statusCode == 200){
    pulse =0;
  }
  Serial.print("Response: ");
  Serial.println(response);
  }else{
    Serial.println("Failed to server");
  }

  delay(20000);
}

void printWifiStatus() {
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  long rssi = WiFi.RSSI();
  Serial.print("Signal Strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}

void increase() {
  pulse++;
}