// ModelCard.jsx

const ModelCard = ({ model, onUpdate, onDelete }) => {
    // Assuming 'model' object has properties like model_name, provider, is_public
    const { id, model_name, provider, is_public } = model;
    const accessStatus = is_public ? 'Public Hosted' : 'Private';
  
    return (
      <div className="bg-white border-2 border-dashed border-gray-400 rounded-lg p-6 flex flex-col min-h-[280px]">
        <div className="text-center mb-5 flex-grow-0">
          <span className="text-xs text-gray-600 font-medium">
            • {accessStatus}
          </span>
          <h3 className="mt-2 mb-1 text-xl font-bold text-gray-900 tracking-wide">
            {model_name}
          </h3>
          <p className="text-sm text-red-600 font-bold">{provider}</p>
        </div>
  
        <div className="border-t-2 border-blue-600 pt-4 mb-5 flex-grow">
          <ul className="list-disc pl-5 text-gray-700 text-sm leading-relaxed">
            <li>Meta Features</li>
            <li>45 Parameter</li>
            <li>34 Temperature</li>
            <li>Score/Benchmark</li>
          </ul>
        </div>
  
        <button
          onClick={() => onUpdate(model.id)} // Or open an edit modal
          className="w-full py-2.5 bg-blue-600 text-white rounded-full cursor-pointer font-semibold text-xs tracking-wider hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex-grow-0"
        >
          VIEW/CONFIGURE
        </button>
        {/* Potentially add a delete button for admin users */}
        {/* <button
          onClick={() => onDelete(model.id)}
          className="mt-2 w-full py-2.5 bg-red-600 text-white rounded-full cursor-pointer font-semibold text-xs tracking-wider hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Delete
        </button> */}
      </div>
    );
  };
  
  export default ModelCard;
