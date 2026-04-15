import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeasonSelectProps {
  seasons: string[];
  value: string;
  onValueChange: (season: string) => void;
}

export default function SeasonSelect({
  seasons,
  value,
  onValueChange,
}: SeasonSelectProps) {
  const sorted = [...seasons].sort((a, b) => Number(b) - Number(a));

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue placeholder="Season" />
      </SelectTrigger>
      <SelectContent>
        {sorted.map((season) => (
          <SelectItem key={season} value={season}>
            {season}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
