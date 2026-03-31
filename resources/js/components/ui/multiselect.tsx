import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

type Props = {
    selected: string[];
    placeholder: string;
    onChange: (selected: string[]) => void;
    options: { value: string; label: string }[];
};

export function MultiSelect({ selected, placeholder, onChange, options }: Props) {
    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const allSelected = selected.length === options.length;

    const toggleAll = () => {
        if (allSelected) {
            onChange([]); // deselecciona todo
        } else {
            onChange(options.map(o => o.value)); // selecciona todo
        }
    };

    const selectedLabels = options
        .filter(option => selected.includes(option.value))
        .map(option => option.label);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full flex justify-start">
                    {selected.length === 0
                        ? placeholder
                        : (allSelected ? "Todos seleccionados" : selectedLabels.join(", "))}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {/* Seleccionar todos */}
                <DropdownMenuItem
                    onClick={toggleAll}
                    className="flex items-center justify-between font-medium"
                >
                    Seleccionar todos
                    {allSelected && <Check className="w-4 h-4" />}
                </DropdownMenuItem>

                <div className="h-px bg-border my-1" />

                {/* Opciones individuales */}
                {options.map(({ value, label }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => toggleOption(value)}
                        className="flex items-center justify-between"
                    >
                        {label}
                        {selected.includes(value) && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
