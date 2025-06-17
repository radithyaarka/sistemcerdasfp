import './styleApp.css';
import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler, // Menambahkan Filler untuk area di bawah garis
} from 'chart.js';

// Impor dari Firebase untuk koneksi database
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// Registrasi ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler
);

function MonitorPage() {
  // State untuk Waktu
  const [time, setTime] = useState(DateTime.now().setZone('Asia/Jakarta'));

  // State untuk Data Sensor dan Koneksi
  const [temperature, setTemperature] = useState(null);
  const [smoke, setSmoke] = useState(null);
  const [dangerStatus, setDangerStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // State untuk Data Chart
  const [datetimeArray, setDatetimeArray] = useState([]);
  const [tempArray, setTempArray] = useState([]);
  const [smokeArray, setSmokeArray] = useState([]);
  
  // Hook untuk mengambil data dari Firebase secara real-time
  useEffect(() => {
    // Query ke collection "deteksi_kebakaran"
    const q = query(collection(db, "data_points"), orderBy("timestamp", "desc"), limit(20));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setIsConnected(true);

      if (querySnapshot.empty) {
        console.log("No data in Firestore yet.");
        return;
      }

      const newDatetimes = [];
      const newTemps = [];
      const newSmokes = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Membaca field yang benar dari Firestore
        newDatetimes.unshift(new Date(data.timestamp?.toDate()).toLocaleTimeString('id-ID'));
        newTemps.unshift(data.temperature);
        newSmokes.unshift(data.smoke_level);
      });

      // Mengambil data terbaru untuk ditampilkan di kartu utama
      const latestData = querySnapshot.docs[0].data();
      setTemperature(latestData.temperature);
      setSmoke(latestData.smoke_level);
      setDangerStatus(latestData.danger_status);

      // Update state untuk data chart
      setDatetimeArray(newDatetimes);
      setTempArray(newTemps);
      setSmokeArray(newSmokes); 

    }, (error) => {
      console.error("Firebase connection error:", error);
      setIsConnected(false);
    });

    // Cleanup listener saat komponen dibongkar
    return () => unsubscribe();
  }, []);

  // Hook untuk jam
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(DateTime.now().setZone('Asia/Jakarta'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Data untuk Chart
  const chartData = {
    labels: datetimeArray.slice(-8), // Tampilkan 8 data terakhir
    datasets: [
      {
        label: 'Temperature (°C)',
        data: tempArray.slice(-8),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Smoke Level (%)',
        data: smokeArray.slice(-8),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Opsi untuk Chart
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
  
  // Objek untuk styling status koneksi
  const connectionStatus = {
    text: isConnected ? 'Connected to DB' : 'Disconnected',
    icon: isConnected ? 'bi-cloud-check' : 'bi-cloud-slash'
  };

  // Fungsi untuk mendapatkan style berdasarkan status bahaya
  const getDangerStatusStyle = (status) => {
    switch (status) {
      case 'BAHAYA':
        return { cardClass: 'card-red', iconClass: 'bi-exclamation-triangle-fill' };
      case 'WASPADA':
        return { cardClass: 'card-orange', iconClass: 'bi-exclamation-triangle' };
      case 'AMAN':
        return { cardClass: 'card-green', iconClass: 'bi-shield-check' };
      default:
        return { cardClass: 'card-grey', iconClass: 'bi-question-circle' };
    }
  };
  const statusStyle = getDangerStatusStyle(dangerStatus);

  return (
    <div className="container-phone">
      {/* Header */}
      <div className="header-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="dashboard-title mb-0">Dashboard Monitor</h2>
            <p className="dashboard-subtitle mb-0">
              {time.toFormat("EEEE, dd LLL yyyy")}
            </p>
          </div>
          <div className="profile-section">
            <img src="logo192.png" alt="Profile" className="profile-img" />
          </div>
        </div>
      </div>

      <div className="body-dashboard">
        {/* Baris 1 - Suhu & Asap */}
        <div className="row mb-3">
          <div className="col-6">
            <div className="status-card card-blue">
              <div className="card-content">
                <div className="card-icon">
                  <i className="bi bi-thermometer-half"></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {temperature != null ? temperature.toFixed(1) : '--'}°C
                  </h3>
                  <p className="card-label">Temperature</p>
                  <small className="card-status">
                    {isConnected ? 'Real-time' : 'Offline'}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="status-card card-green">
              <div className="card-content">
                <div className="card-icon">
                  <i className="bi bi-wind"></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {smoke != null ? smoke.toFixed(1) : '--'}%
                  </h3>
                  <p className="card-label">Smoke Level</p>
                  <small className="card-status">
                    {isConnected ? 'Real-time' : 'Offline'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Baris 2 - Koneksi & Waktu */}
        <div className="row mb-3">
          <div className="col-6">
            <div className="status-card card-orange">
              <div className="card-content">
                <div className="card-icon">
                  <i className={`bi ${connectionStatus.icon}`}></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {isConnected ? 'ONLINE' : 'OFFLINE'}
                  </h3>
                  <p className="card-label">Connection</p>
                  <small className="card-status">
                    {connectionStatus.text}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="status-card card-purple">
              <div className="card-content">
                <div className="card-icon">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {time.toFormat("HH:mm")}
                  </h3>
                  <p className="card-label">Current Time</p>
                  <small className="card-status">
                    {time.toFormat("'WIB'")}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Baris 3 - Status Bahaya (Fuzzy Output) */}
        <div className="row mb-4">
          <div className="col-12">
            <div className={`status-card ${statusStyle.cardClass}`}>
              <div className="card-content">
                <div className="card-icon">
                  <i className={`bi ${statusStyle.iconClass}`}></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">{dangerStatus || '--'}</h3>
                  <p className="card-label">Danger Status</p>
                  <small className="card-status">Based on fuzzy logic</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="chart-card">
          <div className="chart-header">
            <h4 className="chart-title">Sensor Data Trends</h4>
            <div className="chart-controls">
              <span className="data-points">
                {tempArray.length > 0 ? `${tempArray.length} data points` : 'No data'}
              </span>
              <i className="bi bi-graph-up chart-icon"></i>
            </div>
          </div>
          <div className="chart-container">
            {tempArray.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="no-data-placeholder">
                <i className="bi bi-graph-up-arrow"></i>
                <p>No sensor data available</p>
                <small>Waiting for data from the database</small>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigasi (bisa di-uncomment jika diperlukan) */}
      {/* <div className="navbar center d-flex justify-content-center align-items-center">
        <div className="col-navbar d-flex justify-content-center">
          <Link to="/" className="nav-link active">
            <i className="bi bi-speedometer"></i>
            <p className="mb-0">Monitor</p>
          </Link>
        </div>
        <div className="col-navbar d-flex justify-content-center">
          <Link to="/control" className="nav-link">
            <i className="bi bi-toggles"></i>
            <p className="mb-0">Control</p>
          </Link>
        </div>
      </div> */}
    </div>
  );
}

export default MonitorPage;