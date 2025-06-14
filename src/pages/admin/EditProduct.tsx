
import React from 'react';
import { useParams } from 'react-router-dom';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Placeholder form similar to subcategory/user/seller
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <p className="mb-6 text-gray-700">Product ID: {id}</p>
      <form className="space-y-4 max-w-lg bg-white border rounded shadow p-6">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Product name..." />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" defaultValue="Description..." />
        </div>
        <div>
          <label className="block font-medium mb-1">Category</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Category..." />
        </div>
        <div>
          <label className="block font-medium mb-1">Price</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="0.00" type="number" />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <input className="w-full border rounded px-3 py-2" defaultValue="Published" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
