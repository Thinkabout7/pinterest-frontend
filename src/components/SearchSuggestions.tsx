// src/components/SearchSuggestions.tsx

interface Props {
  suggestions: string[];
  onSelect: (value: string) => void;
}

const SearchSuggestions = ({ suggestions, onSelect }: Props) => {
  return (
    <div className="mt-2 bg-white shadow-lg rounded-xl border animate-fadeIn">
      {suggestions.map((item, index) => (
        <div
          key={index}
          onClick={() => onSelect(item)}
          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm transition"
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default SearchSuggestions;
