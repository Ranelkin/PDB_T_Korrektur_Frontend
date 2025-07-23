
const ExerciseTypeSelector = ({ selectedType, onSelectType }) => {
  const EXERCISE_TYPES = [
    { id: 'ER', name: 'ER Diagram' },
    { id: 'FUNCTIONAL', name: 'Functional Dependencies' }
  ];

  const containerStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '16px',
    color: '#4b5563',
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle} htmlFor="exerciseType">Exercise Type</label>
      <select
        id="exerciseType"
        style={selectStyle}
        value={selectedType}
        onChange={(e) => onSelectType(e.target.value)}
      >
        <option value="">Select exercise type</option>
        {EXERCISE_TYPES.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExerciseTypeSelector;