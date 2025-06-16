import './styleApp.css';
import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { useMqtt } from '../mqtt/MqttProvider';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

function MonitorPage() {
  const [time, setTime] = useState(DateTime.now().setZone('Asia/Jakarta'));
  const [authKey, setAuthKey] = useState('');

  const {
    connectToBroker,
    temperature,
    humidity,
    isConnected,
    datetimeArray,
    tempArray,
    humArray,
    lampStatus // ✅ Sudah ditambahkan di sini
  } = useMqtt();

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
  );

  const chartData = {
    labels: datetimeArray.slice(0, 8),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: tempArray.slice(0, 8),
        fill: false,
        borderColor: '#ff6b6b',
        backgroundColor: '#ff6b6b',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Humidity (%)',
        data: humArray.slice(0, 8),
        fill: false,
        borderColor: '#4ecdc4',
        backgroundColor: '#4ecdc4',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          stepSize: 10,
          callback: function(value) {
            return value + (this.chart.data.datasets[0].label.includes('Temperature') ? '°C' : '%');
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(DateTime.now().setZone('Asia/Jakarta'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConnect = () => {
    if (authKey.trim()) {
      connectToBroker(authKey.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  const getConnectionStatus = () => {
    return {
      text: isConnected ? 'Connected' : 'Disconnected',
      class: isConnected ? 'online' : 'offline',
      icon: isConnected ? 'bi-wifi' : 'bi-wifi-off'
    };
  };

  const connectionStatus = getConnectionStatus();

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
        {/* Row 1 - Temperature & Humidity */}
        <div className="row mb-3">
          <div className="col-6">
            <div className="status-card card-blue">
              <div className="card-content">
                <div className="card-icon">
                  <i className="bi bi-thermometer-half"></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {temperature || '--'}°C
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
                  <i className="bi bi-moisture"></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">
                    {humidity || '--'}%
                  </h3>
                  <p className="card-label">Humidity</p>
                  <small className="card-status">
                    {isConnected ? 'Real-time' : 'Offline'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 - Connection & Time */}
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

        {/* ✅ Row 3 - Lamp Status (Fuzzy Output) - TELAH DITAMBAHKAN DI SINI */}
        <div className="row mb-4">
          <div className="col-12">
            <div className={`status-card ${lampStatus === 'SAFE' ? 'card-green' : 'card-red'}`}>
              <div className="card-content">
                <div className="card-icon">
                  <i className={`bi ${lampStatus === 'SAFE' ? 'bi-shield-check' : 'bi-exclamation-triangle'}`}></i>
                </div>
                <div className="card-info">
                  <h3 className="card-value">{lampStatus || '--'}</h3>
                  <p className="card-label">Lamp Status</p>
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
                <small>Connect to MQTT broker to view real-time data</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="navbar center d-flex justify-content-center align-items-center">
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
      </div>
    </div>
  );
}

export default MonitorPage;