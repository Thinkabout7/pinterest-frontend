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
          key={`${item}-${index}`}
          onClick={() => onSelect(item)}
          className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
        >
          <div className="text-sm font-medium line-clamp-1">{item}</div>
        </div>
      ))}
    </div>
  );
};

export default SearchSuggestions;
