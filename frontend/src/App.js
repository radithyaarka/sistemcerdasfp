import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MonitorPage from './pages/MonitorPage';
import { MqttProvider } from './mqtt/MqttProvider';

export default function App() {
    return (
        <MqttProvider>
            <Router>
                    <Routes>
                        <Route path="/" element={<MonitorPage />} />
                    </Routes>
            </Router>
        </MqttProvider>
    );
}
