"use client";

interface ConversationFiltersProps {
  value?: string;
  onChange?: (status: string) => void;
}

const filters = [
  {
    value: "all",
    label: "Todas",
  },
  {
    value: "PENDING",
    label: "Pendentes",
  },
  {
    value: "ACTIVE",
    label: "Ativas",
  },
  {
    value: "DONE",
    label: "Concluídas",
  },
];

export default function ConversationFilters({
  value = "all",
  onChange,
}: ConversationFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {filters.map((filter) => {
        const selected = value === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onChange?.(filter.value)}
            className={`
              whitespace-nowrap
              rounded-lg
              px-3
              py-2
              text-sm
              transition-all

              ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }
            `}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}