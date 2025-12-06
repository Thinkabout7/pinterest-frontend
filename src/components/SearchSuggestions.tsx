// src/components/SearchSuggestions.tsx

interface SuggestionItem {
  text: string;
  snippet?: string;
}

interface Props {
  suggestions: SuggestionItem[];
  onSelect: (value: string) => void;
}

const SearchSuggestions = ({ suggestions, onSelect }: Props) => {
  return (
    <div className="mt-2 bg-white shadow-lg rounded-xl border animate-fadeIn">
      {suggestions.map((item, index) => (
        <div
          key={`${item.text}-${index}`}
          onClick={() => onSelect(item.text)}
          className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
        >
          <div className="text-sm font-medium line-clamp-1">{item.text}</div>
          {item.snippet && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {item.snippet}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export type { SuggestionItem };
export default SearchSuggestions;
