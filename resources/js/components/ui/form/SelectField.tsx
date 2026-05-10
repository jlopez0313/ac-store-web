import InputError from '@/components/input-error';
import { InputHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { Label } from '../label';

import { cn } from '@/lib/utils';
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
const animatedComponents = makeAnimated();

type Item = {
    idx: string;
    value: string;
}

type Option = {
    value: string;
    label: string;
}

type Props = InputHTMLAttributes<HTMLInputElement> & {
    item: Item | string;
    lista: any[];
    name: string;
    title: string;
    value?: number | number[] | string | string[];
    multiple?: boolean;
    required?: boolean;
    placeholder?: string;
    error: string | undefined;
    onChange: (e: string | string[]) => void;
    isLoading?: boolean;
}

export const SelectField = ({
    item,
    name,
    title,
    lista = [],
    value = '',
    multiple = false,
    required = false,
    placeholder,
    error = '',
    onChange,
    isLoading = false,
    ...props
}: Props) => {

    const [dataList, setDataList] = useState<Option[]>([]);

    const onPrepareData = (selected: any) => {

        if (multiple) {
            if (!selected) {
                onChange([]);
                return;
            }

            const hasAll = selected.find((s: any) => s.value === "ALL");

            if (hasAll) {
                const allValues = dataList.filter(o => o.value !== "ALL").map(o => o.value);
                onChange(allValues as string[]);
            } else {
                onChange(selected.map((s: any) => s.value));
            }
        } else {
            onChange(selected?.value ?? "");
        }
    };

    const selectedValue = useMemo(() => {
        if (multiple) {
            if (Array.isArray(value)) {
                const actualValues = dataList.filter(o => o.value !== "ALL").map(o => o.value);
                const valueArray = value as any[];
                return dataList.filter((item) => valueArray.includes(item.value));
            }
            return [];
        } else {
            return dataList.find((item) => item.value == value) ?? null;
        }
    }, [dataList, value]);

    useEffect(() => {
        const onMapList = () => {

            const mapped = lista.map((elem) => {
                const itemObj = typeof item === 'object' ? item : null;
                return {
                    value: itemObj ? elem[itemObj.idx] : elem,
                    label: itemObj ? elem[itemObj.value] : elem,
                };
            });

            if (multiple) {
                mapped.unshift({ value: "ALL", label: "TODOS" });
            }

            setDataList(mapped);
        };

        onMapList();
    }, [lista, item, multiple, value]);

    return (
        <div>
            {title && (
                <Label htmlFor={name}> {title}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}

            <ReactSelect
                isClearable={true}
                menuPortalTarget={document.body}
                inputId={name}
                required={required}
                placeholder={placeholder ?? title}
                name={name}
                isMulti={multiple}
                isLoading={isLoading}
                options={dataList}
                value={selectedValue}
                closeMenuOnSelect={!multiple}
                components={animatedComponents}
                onChange={onPrepareData}
                unstyled
                classNames={{
                    control: ({ isFocused }) => cn(
                        "flex mt-2 min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        isFocused && "ring-1 ring-ring border-ring"
                    ),
                    placeholder: () => "text-muted-foreground",
                    singleValue: () => "text-foreground",
                    multiValue: () => "bg-muted rounded-sm py-0.5 px-1.5 flex items-center gap-1",
                    multiValueLabel: () => "text-xs",
                    multiValueRemove: () => "text-muted-foreground hover:text-foreground",
                    menu: () => "mt-1 rounded-md border bg-popover text-popover-foreground shadow-md z-50",
                    menuList: () => "p-1",
                    option: ({ isFocused, isSelected }) => cn(
                        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-hidden",
                        isFocused && "bg-accent text-accent-foreground",
                        isSelected && "bg-primary text-primary-foreground"
                    ),
                    noOptionsMessage: () => "p-4 text-center text-sm text-muted-foreground",
                    loadingMessage: () => "p-4 text-center text-sm text-muted-foreground",
                    input: () => "text-foreground",
                    indicatorSeparator: () => "bg-border mx-1",
                    dropdownIndicator: () => "text-muted-foreground hover:text-foreground",
                    clearIndicator: () => "text-muted-foreground hover:text-foreground",
                }}
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                    // Reset react-select default styles that might conflict with Tailwind
                    input: (base) => ({ ...base, "input:focus": { boxShadow: "none" } }),
                }}
            />

            <InputError message={error} className="mt-2" />
        </div>
    )
}
