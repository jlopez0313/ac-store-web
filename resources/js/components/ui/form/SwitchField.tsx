import { Label } from '../label';
import { Switch } from '../switch';


type Props = {
    processing: boolean;
    name: string;
    title: string;
    checked?: boolean;
    required?: boolean;
    onChange: (e: boolean) => void;
};

export const SwitchField = ({
    processing,
    title,
    name,
    required = false,
    checked = false,
    onChange = (value: boolean) => {},
}: Props) => {
  return (
    <div className="flex items-center space-x-2 px-3 py-6 rounded-lg border bg-card">
        <Switch
            required={required}
            id={name}
            checked={checked}
            onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={name} className="text-sm cursor-pointer">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
    </div>
  )
}
