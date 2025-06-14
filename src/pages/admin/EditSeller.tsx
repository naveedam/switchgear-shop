
import React from "react";
import { useParams } from "react-router-dom";

const EditSeller: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Placeholder form
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Seller</h1>
      <p className="mb-6 text-gray-700">Seller ID: {id}</p>
      <form className="space-y-4 max-w-lg bg-white border rounded shadow p-6">
        <div>
          <label className="block font-medium mb-1">Company Name</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Company Name..." />
        </div>
        <div>
          <label className="block font-medium mb-1">Contact Email</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Email..." />
        </div>
        <div>
          <label className="block font-medium mb-1">Phone Number</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Phone..." />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditSeller;

