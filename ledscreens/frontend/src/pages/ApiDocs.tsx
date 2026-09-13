import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDocs = () => {
  return (
    <div className="bg-white min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">API Documentation</h1>
          <p className="text-slate-500 font-medium">Interactive OpenAPI 3.0 specification for the E3Di API.</p>
        </div>
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50">
          <SwaggerUI url="/swagger.json" />
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
