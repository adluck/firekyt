import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface SystemStatus {
  status: string;
  message: string;
  services: {
    authentication: { status: string; description: string };
    smartLinkAssistant: { status: string; description: string };
    database: { status: string; description: string };
    contentGeneration: { status: string; description: string };
  };
  alternativeLogin?: {
    email: string;
    password: string;
    note: string;
  };
  eta?: string;
}

export function EmergencyStatusBanner() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (response.ok) {
          const statusData = await response.json();
          setStatus(statusData);
        }
      } catch (error) {
        console.log('Status check failed - normal operation mode');
      }
    };

    checkSystemStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status || status.status === 'operational' || !isVisible) {
    return null;
  }

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'limited':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'operational':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'maintenance':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'limited':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className={`border-l-4 p-4 ${getStatusColor(status.status)} relative`}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
      
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Service Status Update</h3>
          <p className="mb-4">{status.message}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {Object.entries(status.services).map(([key, service]) => (
              <div key={key} className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-sm">{service.description}</span>
              </div>
            ))}
          </div>
          
          {status.alternativeLogin && (
            <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
              <h4 className="font-medium mb-2">Alternative Access</h4>
              <p className="text-sm mb-2">{status.alternativeLogin.note}</p>
              <div className="text-sm font-mono">
                <div>Email: {status.alternativeLogin.email}</div>
                <div>Password: {status.alternativeLogin.password}</div>
              </div>
            </div>
          )}
          
          {status.eta && (
            <p className="text-sm font-medium">
              <strong>ETA:</strong> {status.eta}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}