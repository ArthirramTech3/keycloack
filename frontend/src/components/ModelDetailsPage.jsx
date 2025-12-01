import React from 'react';

const ModelDetailsPage = ({ model, onBack }) => {
  // Mock data based on the screenshot
  const mockModel = {
    name: 'OPEN AI OMINI 4.1',
    type: 'Public Hosted',
    features: ['Meta Features', '45 Parameter', '34 Temperature', 'Score/Benchmark'],
    status: 'Active',
    balance: '8765343 TKS',
    purchaseHistory: [
      { id: 1, date: '24/09/2025', addedBy: 'Kisan@peri.com', tokens: 234343, amount: 500 },
      { id: 2, date: '20/09/2025', addedBy: 'Admin@peri.com', tokens: 500000, amount: 1200 },
      { id: 3, date: '15/09/2025', addedBy: 'Manager@peri.com', tokens: 100000, amount: 250 },
    ],
  };

  const displayModel = model || mockModel;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Model Details</h1>
          <p className="text-gray-500">Manage and configure onboarded AI models</p>
        </div>
        <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
          Onboard LM
        </button>
      </div>

      <div className="mb-8">
        <button onClick={onBack} className="text-blue-600 hover:underline">
          &larr; Back to Model Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Model Info Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">{displayModel.type}</p>
          <h2 className="text-2xl font-bold my-2">{displayModel.name}</h2>
          <hr className="my-4" />
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {displayModel.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-4">
            <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
              {displayModel.status}
            </span>
            <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
              Request Deep Scan &rarr;
            </button>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-gray-600">Remaining Balance</h3>
          <p className="text-4xl font-bold my-2">{displayModel.balance}</p>
          <div className="flex gap-4 mt-4">
            <button className="border border-gray-300 py-2 px-6 rounded-lg hover:bg-gray-100">Buy</button>
            <button className="border border-gray-300 py-2 px-6 rounded-lg hover:bg-gray-100">Filter</button>
          </div>
          <button className="text-blue-600 mt-6 text-sm font-semibold hover:underline">
            + Add Token Credits
          </button>
        </div>
      </div>

      {/* Usage Analytics Chart */}
      <div className="mt-8 bg-gradient-to-r from-blue-400 to-teal-400 h-64 flex items-center justify-center rounded-lg shadow-md">
        <p className="text-white text-2xl font-bold">Usage Analytics Chart</p>
      </div>

      {/* Token Purchase History */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Token Purchase History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">S.No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Added Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Added By</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Added Tokens</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              {displayModel.purchaseHistory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{item.id}</td>
                  <td className="py-3 px-4">{item.date}</td>
                  <td className="py-3 px-4">{item.addedBy}</td>
                  <td className="py-3 px-4">{item.tokens}</td>
                  <td className="py-3 px-4">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelDetailsPage;
