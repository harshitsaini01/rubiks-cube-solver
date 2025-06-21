import React from 'react';

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor }) => {
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);

  const colors: { [key: string]: string } = {
    W: 'bg-white border border-gray-300',
    Y: 'bg-yellow-400',
    O: 'bg-orange-500',
    R: 'bg-red-500',
    G: 'bg-green-500',
    B: 'bg-blue-500',
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onSelectColor(color);
  };

  return (
    <div className="flex space-x-2">
      {Object.keys(colors).map((color) => (
        <button
          key={color}
          className={`w-8 h-8 rounded-full ${colors[color]} hover:opacity-80 ${
            selectedColor === color ? 'ring-2 ring-black' : ''
          }`}
          onClick={() => handleColorSelect(color)}
          title={color}
        />
      ))}
    </div>
  );
};

export default ColorPicker;