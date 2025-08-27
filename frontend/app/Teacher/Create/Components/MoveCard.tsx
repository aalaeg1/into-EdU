import { Move } from "lucide-react";
import React from "react";

const MoveCard = ({ onClose }: { onClose: () => void }) => (
 <div className="bg-[#ede9fe] p-6 rounded-lg shadow-lg w-96">
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="side1">
        <span className="font-semibold text-lg text-[#7c3aed]">Move To</span>
      </div>
      <div className="side2">
        <Move className="w-5 h-5 text-[#7c3aed]" />
      </div>
    </div>
     
    <label className="block text-xs text-[#7c3aed] mb-1" htmlFor="tag-input">
      Folder
    </label>
    <input
      id="tag-input"
      className="w-full p-2 rounded border border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-transparent text-[#7c3aed] mb-2"
      placeholder="Search Folder"
      type="text"
    />
   
    <div className="flex justify-end gap-4 mt-4">
      <button
        className="text-[#7c3aed] px-4 py-1 rounded hover:bg-[#ddd6fe]"
        onClick={onClose}
      >
        Cancel
      </button>
      <button className="bg-[#7c3aed] text-white px-4 py-1 rounded hover:bg-[#6d28d9]">
        OK
      </button>
    </div>
  </div>
);

export default MoveCard; 