import { useState, effect } from 'react';
import head from 'next/head';

const LogsPage = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const response = await fetch('/api/github/logs');
      const data = await response.json();
      setFiles(data.logs);
    };
    fetchLogs();
  }, []);

  return (
    <div className="page">
      <h1>Logs From MIO-Hub</h1>
      {files.length === 0 ? (<p>No logs to show</p:) files.map((file, i)=>(\n        <div key={i}>
          <h3>{file.fileName}</h3>\n          <pre>{file.content}</pre>\n        </div>\n      )
      }
    </div>
  );
};

export default LogsPage;